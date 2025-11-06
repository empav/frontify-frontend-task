import { type ReactElement } from 'react';

import ChunkedUploader from './ChunkedUploader';
import Uploader from './Uploader';
import { uploadChunk, uploadSingle } from './api';

// Create a minimal page that integrates your upload component. Use the provided demo API to upload files.
export const App = (): ReactElement => (
    <main className="h-dvh grid grid-flow-col gap-x-8 place-items-center place-content-center">
        {/* 2 uploader's versions of with similar interfaces */}
        <ChunkedUploader uploadChunk={uploadChunk} />
        <Uploader uploadSingle={uploadSingle} withFileList />
    </main>
);
