import { useCallback, useState } from 'react';

import { uploadChunk } from '../api';

const useChunkedUpload = ({ files, chunkSize }: { files: File[]; chunkSize: number }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<unknown>();

    // Following along with the chunk progress state
    const [chunksProgress, setChunksProgress] = useState(0);

    const chunkedUpload = useCallback(async () => {
        if (files.length > 0) {
            setIsUploading(true);
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
                    await uploadChunk(formData);
                    // Update progress
                    setChunksProgress(Math.round(((i + 1) / totalChunks) * 100));
                } catch (error) {
                    setError(error);
                    // Exit immediately if one chunk is in error
                    break;
                } finally {
                    setIsUploading(false);
                }
            }
        }
    }, [chunkSize, files]);

    return { error, isUploading, upload: chunkedUpload, chunksProgress };
};

export default useChunkedUpload;
