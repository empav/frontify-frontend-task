import { useRef, type ReactElement } from 'react';

import FileList, { type FileListRef } from './FileList';
import Uploader from './Uploader';

// Create a minimal page that integrates your upload component. Use the provided demo API to upload files.
export const App = (): ReactElement => {
    const fileListRef = useRef<FileListRef>(null);
    return (
        <main className="h-dvh flex flex-col gap-y-8 items-center justify-center [&_section]:flex [&_section]:gap-x-8">
            <section>
                {/* Uploader for single/multiple files */}
                <Uploader chunked={false} onSuccess={() => fileListRef.current?.refetch()} />
                {/* Uploader for chunked files */}
                <Uploader chunked onSuccess={() => fileListRef.current?.refetch()} />
            </section>
            <section>
                {/* Independent file list. Can be used both independently from uploader or declaring withFileList as uploader props */}
                <FileList ref={fileListRef} />
            </section>
        </main>
    );
};
