export const fetchFiles = async (): Promise<File[]> => {
    const res = await fetch('/api/files');
    const data = (await res.json()) as { files: File[] };
    return data.files;
};

export const uploadSingle = async (file: File): Promise<Response> => {
    const body = new FormData();
    body.append('file', file);
    return fetch('/api/upload-single', {
        method: 'POST',
        body,
    });
};

export const uploadChunk = async (body: FormData) => {
    return fetch('/api/upload-chunk', {
        method: 'POST',
        body,
    });
};
