import React, { useRef, useState } from 'react';

import FileList, { type FileListRef } from './FileList';
import { fetchFiles } from './api';

type Props = {
    // Pluggable upload logic: the component must not be tied to a specific upload technology or API.
    // Endpoints can use different request and response types or even use something like GraphQL.
    uploadSingle: (body: File) => Promise<Response>;
    // It should be possible to combine the uploader and file list seamlessly into a complete upload user interface withFileList=true
    // It should be possible to use the uploader component without the file list withFileList=false
    withFileList?: boolean;
};

const Uploader = ({ uploadSingle, withFileList = false }: Props) => {
    const [files, setFiles] = useState<File[]>([]);

    const fileListRef = useRef<FileListRef>(null);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };
    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const promises = [];
        for (const file of files) {
            promises.push(uploadSingle(file));
        }

        try {
            await Promise.all(promises);
            fileListRef.current?.refetch();
            setFiles([]);
        } catch (error) {
            console.error(error);
            alert(error);
        }
    };

    return (
        <>
            <form onSubmit={onSubmit} className="p-6 rounded-lg shadow border flex flex-col gap-y-4">
                <h2 className="text-xl font-semibold text-center">Upload files</h2>

                <label
                    htmlFor="file-upload"
                    className="p-4 flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer"
                >
                    <span className="text-gray-600 text-sm">Click and select some files</span>
                    <input id="file-upload" type="file" className="hidden" multiple onChange={onChange} />
                </label>

                {files.length > 0 ? (
                    <ul className="text-sm text-gray-700 space-y-2 max-h-32 overflow-auto">
                        {files.map((file, index) => (
                            <li key={index} className="truncate">
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
            </form>
            {withFileList ? <FileList fetchFiles={fetchFiles} ref={fileListRef} /> : null}
        </>
    );
};

export default Uploader;
