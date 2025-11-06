import React, { useRef, useState } from 'react';

import FileList, { type FileListRef } from './FileList';
import { fetchFiles } from './api';

/**
 * A component that handles file uploads by splitting files into chunks.
 *
 * @component
 * @param {Object} props - The component props
 * @param {(formData: FormData) => Promise<Response>} props.uploadChunk - Function to upload individual chunks
 * @param {boolean} [props.withFileList=false] - Whether to show the file list component
 *
 * @remarks
 * This component provides:
 * - File selection through an input
 * - Progress tracking during upload
 * - Chunked file upload functionality
 * - Optional file list display
 *
 * The file is split into chunks of predefined size (CHUNK_SIZE) and uploaded sequentially.
 * Upload progress is displayed in a progress bar.
 *
 * @example
 * ```tsx
 * <ChunkedUploader
 *   uploadChunk={async (formData) => await fetch('/api/upload', { method: 'POST', body: formData })}
 *   withFileList={true}
 * />
 * ```
 */

type Props = {
    uploadChunk: (body: FormData) => Promise<Response>;
    withFileList?: boolean;
};

const CHUNK_SIZE = 1024 * 50; // 50 KB per chunk

const ChunkedUploader = ({ uploadChunk, withFileList = false }: Props) => {
    const [file, setFile] = useState<File>();
    const [uploadProgress, setUploadProgress] = useState(0);

    const fileListRef = useRef<FileListRef>(null);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0]);
        setUploadProgress(0);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (file) {
            // Calculate number of chunks based on CHUNK_SIZE
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(file.size, start + CHUNK_SIZE);
                // Slice a file in chunks of CHUNK_SIZE size
                const chunk = file.slice(start, end);

                const formData = new FormData();
                formData.append('file', chunk, file.name);
                formData.append('currentChunkIndex', i.toString());
                formData.append('totalChunks', totalChunks.toString());

                try {
                    const response = await uploadChunk(formData);

                    if (!response.ok) {
                        throw new Error(await response.text());
                    }

                    // Update progress
                    setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
                } catch (error) {
                    console.error('Chunk upload failed', error);
                    // Exit immediately if one chunk is in error
                    break;
                }
            }
            fileListRef.current?.refetch();
        }
    };

    return (
        <>
            <form onSubmit={onSubmit} className="p-6 rounded-lg shadow border flex flex-col gap-y-4">
                <h2 className="text-xl font-semibold text-center">Upload a file in chunks</h2>
                <input
                    type="file"
                    onChange={onChange}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md
                   file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
                   hover:file:bg-blue-100"
                    tabIndex={0}
                    role="button"
                    aria-describedby="file-upload"
                    data-testid="file-input"
                />
                <span id="file-upload" className="sr-only">
                    Click to select a file
                </span>
                <div className="mt-4">
                    <div className="h-3 bg-gray-200 rounded-full">
                        <div
                            className="h-3 bg-blue-600 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">{uploadProgress}% completed</p>
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:bg-blue-400"
                    disabled={!file}
                >
                    Upload
                </button>
            </form>
            {withFileList ? <FileList fetchFiles={fetchFiles} ref={fileListRef} /> : null}
        </>
    );
};

export default ChunkedUploader;
