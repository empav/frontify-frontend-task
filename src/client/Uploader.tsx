import React, { useRef, useState } from 'react';

import FileList, { type FileListRef } from './FileList';
import useChunkedUpload from './hooks/useChunkedUpload';
import useUpload from './hooks/useUpload';
import { type APIError } from './types';

export type Props = {
    withList?: boolean;
    chunked?: boolean;
    chunkSize?: number;
    onSuccess?: () => void;
    onFail?: (error: unknown) => void;
};

const CHUNK_SIZE = 1024 * 50; // 50 KB per chunk

const Uploader = ({
    chunked = false,
    chunkSize = CHUNK_SIZE,
    withList = false,
    onSuccess = () => {},
    onFail = () => {},
}: Props) => {
    // Let the uploader refetch files in its child FileList if present
    const fileListRef = useRef<FileListRef>(null);

    const [files, setFiles] = useState<File[]>([]);

    const { upload: startUpload, isUploading, error: uploadError } = useUpload(files);
    const {
        upload: startChunkedUpload,
        isUploading: isUploadingChunks,
        chunksProgress,
        error: uploadChunksError,
    } = useChunkedUpload({ files, chunkSize });

    const inputRef = useRef<HTMLInputElement | null>(null);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            chunked ? await startChunkedUpload() : await startUpload();
            setFiles([]);
            fileListRef.current?.refetch();
            onSuccess();
        } catch (error) {
            onFail(JSON.stringify(error));
        }
    };

    const getError = () => {
        const error = (uploadError || uploadChunksError) as APIError;
        return error.error;
    };

    return (
        <>
            <form onSubmit={onSubmit} className="p-6 rounded-lg shadow border flex flex-col gap-y-4">
                <h2 className="text-xl font-semibold text-center">
                    {chunked ? 'Upload a file in chunks' : 'Upload files'}
                </h2>
                {isUploading || isUploadingChunks ? <p>Uploading files...</p> : null}
                {uploadError || uploadChunksError ? <p className="text-red-500 text-sm">{getError()}</p> : null}
                {!chunked ? (
                    <>
                        {/* Single/Multiple uploader */}
                        <button
                            type="button"
                            className="p-4 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                            // Accessibility: ensure the solution meets accessibility standards
                            aria-describedby="file-upload-description"
                            onClick={() => {
                                inputRef.current?.click();
                            }}
                        >
                            <span id="file-upload-description" className="text-gray-600 text-sm">
                                Click or tab to select files
                            </span>
                            <input
                                id="file-input"
                                data-testid="file-input"
                                ref={inputRef}
                                type="file"
                                className="hidden"
                                multiple
                                onChange={onChange}
                            />
                        </button>

                        {files.length > 0 ? (
                            <ul className="text-sm text-gray-700 space-y-2 max-h-32 overflow-auto">
                                {files.map((file, index) => (
                                    <li key={`${file.name}-${index}`} className="truncate">
                                        📄 {file.name}
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </>
                ) : (
                    <>
                        {/* Chunked single-file uploader */}
                        <input
                            type="file"
                            onChange={onChange}
                            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md
                   file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
                   hover:file:bg-blue-100"
                            tabIndex={0}
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
                                    style={{ width: `${chunksProgress}%` }}
                                />
                            </div>
                            <p className="text-sm text-gray-600 mt-2 text-center">{chunksProgress}% completed</p>
                        </div>
                    </>
                )}
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:bg-blue-400"
                    disabled={files.length === 0}
                >
                    Upload
                </button>
            </form>
            {withList ? <FileList ref={fileListRef} /> : null}
        </>
    );
};

export default Uploader;
