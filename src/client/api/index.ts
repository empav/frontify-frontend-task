import { type FetchFilesResponse } from '../types';

export const fetchFiles = async (): Promise<FetchFilesResponse> => {
    const res = await fetch('/api/files');
    return (await res.json()) as FetchFilesResponse;
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
