import { useRef, type ReactElement } from 'react';

import FileList, { type FileListRef } from './FileList';
import Uploader from './Uploader';
import { fetchFiles, uploadChunk, uploadSingle } from './api';

// Create a minimal page that integrates your upload component. Use the provided demo API to upload files.
export const App = (): ReactElement => {
    const fileListRef = useRef<FileListRef>(null);
    return (
        <main className="h-dvh grid grid-flow-col gap-x-8 place-items-center place-content-center">
            {/* Uploader for single/multiple files */}
            <Uploader upload={uploadSingle} onSuccess={() => fileListRef.current?.refetch} />
            {/* Uploader for chunked files */}
            <Uploader uploadChunk={uploadChunk} onSuccess={() => fileListRef.current?.refetch} />
            {/* Independent file list. Can be used both independently from uploader or declaring withFileList as uploader props */}
            <FileList fetchFiles={fetchFiles} ref={fileListRef} />
        </main>
    );
};
