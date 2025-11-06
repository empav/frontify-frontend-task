import { type ReactElement } from 'react';

import Uploader from './Uploader';
import { uploadSingle } from './api';

// Create a minimal page that integrates your upload component. Use the provided demo API to upload files.
export const App = (): ReactElement => (
    <main className="h-dvh grid grid-flow-col gap-x-8 place-items-center place-content-center">
        <Uploader uploadSingle={uploadSingle} withFileList />
    </main>
);
