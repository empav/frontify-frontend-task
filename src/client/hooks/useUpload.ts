import { useCallback, useState } from 'react';

import { uploadSingle } from '../api';

const useUpload = (files: File[]) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<unknown>();

    const upload = useCallback(async () => {
        setIsUploading(true);
        const promises = [];
        for (const file of files) {
            promises.push(uploadSingle(file));
        }

        try {
            await Promise.all(promises);
        } catch (error) {
            setError(error);
            throw error;
        } finally {
            setIsUploading(false);
        }
    }, [files]);

    return { files, error, isUploading, upload };
};

export default useUpload;
