import React, { useRef, useState } from 'react';

import FileList, { type FileListRef } from './FileList';
import { fetchFiles } from './api';

export type Props = {
    withFileList?: boolean;
    chunkSize?: number;

    onSuccess?: () => void;
    onFail?: (message: string) => void;
} & (
    | {
          // Pluggable upload logic: the component must not be tied to a specific upload technology or API.
          // Endpoints can use different request and response types or even use something like GraphQL.
          upload: (file: File) => Promise<Response>;
          uploadChunk?: never;
      }
    | {
          // Pluggable upload logic: the component must not be tied to a specific upload technology or API.
          // Endpoints can use different request and response types or even use something like GraphQL.
          uploadChunk: (body: FormData) => Promise<Response>;
          upload?: never;
      }
);

const CHUNK_SIZE = 1024 * 50; // 50 KB per chunk

/**
 * Uploader component
 *
 * Renders a file upload form that supports two upload modes:
 * 1) Whole-file multi-file uploads (when the `upload` prop is provided).
 * 2) Single-file chunked upload (when `upload` is not provided and `uploadChunk` is used).
 *
 * The component manages selected files and upload progress state internally and optionally
 * renders a FileList (controlled by `withFileList`) which can be refetched after uploads.
 *
 * Props:
 * @param chunkSize - Optional. Size in bytes of each chunk when performing chunked uploads.
 *                      Defaults to `CHUNK_SIZE`.
 * @param uploadChunk - Optional. Callback invoked for each chunk during chunked uploads.
 *                      Receives a FormData containing:
 *                        - "file": the chunk Blob (with original file name),
 *                        - "currentChunkIndex": current chunk index (0-based),
 *                        - "totalChunks": total number of chunks.
 *                      Expected to return a Promise resolving to a Response-like object
 *                      (the implementation checks `response.ok` and uses `response.text()` on failure).
 * @param upload - Optional. Callback used for whole-file uploads (multi-file mode). Invoked once per File.
 *                 Expected to return a Promise. If provided, the component renders the multi-file UI
 *                 and uses `upload` for each selected file.
 * @param withFileList - Optional. If true, renders a `FileList` component below the uploader and attempts
 *                       to `refetch` it after successful uploads. Defaults to `false`.
 * @param onSuccess - Optional. Triggered on upload success to inform the parent component
 * @param onFail - Optional. Triggered on upload failure to inform the parent component
 *
 * Behavior and implementation notes:
 * - File selection is handled via a hidden or visible <input type="file"> and stored in internal state.
 * - When `upload` is provided, the form submission triggers parallel uploads for all selected files
 *   using `Promise.all`. On success the selected files list is cleared and the file list (if present) is refetched.
 *   Any rejection is caught, and an error is shown and logged.
 * - When operating in chunked mode, only one selected file is uploaded. The file is split into
 *   Math.ceil(file.size / chunkSize) chunks using `file.slice(start, end)`. For each chunk a FormData
 *   payload is created and passed to `uploadChunk`. If a chunk upload response is not OK or the
 *   promise rejects, the loop aborts and the error is shown and logged. Progress state (`chunksProgress`) is
 *   updated after each successfully uploaded chunk (percentage rounded to nearest integer).
 * - After completing (or aborting) a chunked upload, the component attempts to `refetch` the file list if present.
 *
 * Accessibility:
 * - The component exposes descriptive text via `aria-describedby` for the file input area and supports
 *   keyboard activation (click handler triggers the hidden input).
 * - Buttons are disabled when no file is selected to prevent empty submissions.
 *
 * Error handling:
 * - Chunked uploads: stops at first failed chunk; error is shown and logged to the console.
 * - Whole-file uploads: if any upload promise rejects, the aggregate operation fails, the error is logged
 *   and shown.
 *
 * Returns:
 * @returns JSX.Element - the rendered uploader form and optional file list.
 *
 * Example:
 * const uploadFile = async (file: File) => { ... }                 // for whole-file mode
 * const uploadChunk = async (fd: FormData) => fetch('/chunks', { method: 'POST', body: fd });
 *
 * <Uploader upload={uploadFile} withFileList onSuccess={() => {}} onFail={() => {}} />
 * <Uploader chunkSize={1024 * 1024} uploadChunk={uploadChunk} onSuccess={() => {}} onFail={() => {}}/>
 */
const Uploader = ({
    chunkSize = CHUNK_SIZE,
    uploadChunk,
    upload,
    withFileList = false,
    onSuccess = () => {},
    onFail = () => {},
}: Props) => {
    // Files to be uploaded
    const [files, setFiles] = useState<File[]>([]);

    // Error show
    const [error, setError] = useState('');

    // Following along with the chunk progress state
    const [chunksProgress, setChunksProgress] = useState(0);

    // Let the uploader refetch files in its child FileList if present
    const fileListRef = useRef<FileListRef>(null);

    const inputRef = useRef<HTMLInputElement | null>(null);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const onChunkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (uploadChunk && files.length > 0) {
            const file = files[0];
            // Calculate number of chunks based on chunkSize
            const totalChunks = Math.ceil(file.size / chunkSize);

            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(file.size, start + chunkSize);
                // Slice a file in chunks of CHUNK_SIZE size
                const chunk = file.slice(start, end);

                const formData = new FormData();
                formData.append('file', chunk, file.name);
                formData.append('currentChunkIndex', i.toString());
                formData.append('totalChunks', totalChunks.toString());

                try {
                    const response = await uploadChunk(formData);

                    if (!response.ok) {
                        console.error(await response.text());
                        setError('Chunked upload failed');
                        // Trigger fail with message to parent
                        onFail('Chunked upload failed');
                        // Exit immediately if one chunk is in error
                        break;
                    }

                    // Update progress
                    setChunksProgress(Math.round(((i + 1) / totalChunks) * 100));
                } catch (error) {
                    console.error('Chunk upload failed: ', error);
                    setError('Chunked upload failed');
                    // Trigger fail with message to parent
                    onFail('Chunked upload failed');
                    // Exit immediately if one chunk is in error
                    break;
                }
            }
            // Refresh the file list
            fileListRef.current?.refetch();
            // Trigger success to parent
            onSuccess();
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (upload) {
            const promises = [];
            for (const file of files) {
                promises.push(upload(file));
            }

            try {
                await Promise.all(promises);
                fileListRef.current?.refetch();
                // Trigger success to parent
                onSuccess();
                setFiles([]);
            } catch (error) {
                console.error(error);
                setError('Something went wrong during upload');
                // Trigger fail with message to parent
                onFail('Something went wrong during upload');
            }
        }
    };

    return (
        <>
            <form
                onSubmit={upload ? onSubmit : onChunkSubmit}
                className="p-6 rounded-lg shadow border flex flex-col gap-y-4"
            >
                <h2 className="text-xl font-semibold text-center">
                    {upload ? 'Upload files' : 'Upload a file in chunks'}
                </h2>
                <p className="text-red-500 text-sm">{error}</p>
                {upload ? (
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
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:bg-blue-400"
                            disabled={files.length === 0}
                        >
                            Upload
                        </button>
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
                                    style={{ width: `${chunksProgress}%` }}
                                />
                            </div>
                            <p className="text-sm text-gray-600 mt-2 text-center">{chunksProgress}% completed</p>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:bg-blue-400"
                            disabled={files.length === 0}
                        >
                            Upload
                        </button>
                    </>
                )}
            </form>
            {withFileList ? <FileList fetchFiles={fetchFiles} ref={fileListRef} /> : null}
        </>
    );
};

export default Uploader;
