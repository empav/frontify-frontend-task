import { forwardRef } from 'react';

import useFetchFiles from './hooks/useFetchFiles';

export type FileListRef = {
    refetch: () => void;
};

const FileList = forwardRef<FileListRef>((_, ref) => {
    const {
        isFetching,
        data: { files },
        error,
    } = useFetchFiles(ref);

    if (files.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-y-4">
            {isFetching ? <p>Loading...</p> : null}
            {error ? <p className="text-red-500 text-sm">{JSON.stringify(error)}</p> : null}
            <h1>Inside folder ${'{projectRoot}/uploads:'}</h1>
            <table>
                <thead>
                    <tr>
                        <th className="border border-gray-300 text-left p-2">File Name</th>
                        <th className="border border-gray-300 text-left p-2">File Size</th>
                    </tr>
                </thead>
                <tbody>
                    {files.map((f) => (
                        <tr key={f.name}>
                            <td className="border border-gray-300 p-2">{f.name}</td>
                            <td className="border border-gray-300 p-2">{f.size}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

FileList.displayName = 'FileList';

export default FileList;
