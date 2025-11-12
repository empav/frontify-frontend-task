import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';

import { type FetchFilesResponse } from './types';

type Props = {
    fetchFiles: () => Promise<FetchFilesResponse>;
};

export type FileListRef = {
    refetch: () => void;
};

const FileList = forwardRef<FileListRef, Props>(({ fetchFiles }, ref) => {
    const [files, setFiles] = useState<FetchFilesResponse['files']>([]);

    const fetch = useCallback(() => {
        fetchFiles()
            .then((resp) => setFiles(resp.files))
            .catch((error) => alert(error));
    }, [fetchFiles]);

    // fetch data when component mounts
    useEffect(() => {
        fetch();
    }, [fetch]);

    // Refetch data when parent component trigger refetch
    useImperativeHandle(ref, () => ({
        refetch: fetch,
    }));

    if (files.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-y-4">
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
