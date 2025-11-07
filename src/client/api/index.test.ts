import { describe, test, expect, vi } from 'vitest';

import { fetchFiles, uploadSingle, uploadChunk } from '.';

type MockResponse = {
    json: () => Promise<any>;
};

describe('Client APIs', () => {
    test('fetchFiles calls /api/files and returns files array', async () => {
        const files = [{ name: 'a' }] as File[];
        const mockResp: MockResponse = { json: async () => await Promise.resolve({ files }) };
        const fetchMock = vi.fn().mockResolvedValue(mockResp);
        (globalThis as any).fetch = fetchMock;

        const result = await fetchFiles();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith('/api/files');
        expect(result).toEqual(files);
    });

    test('uploadSingle posts to /api/upload-single', async () => {
        const file = { name: 'test.txt' } as unknown as File;

        const fetchMock = vi.fn().mockResolvedValue({});
        (globalThis as any).fetch = fetchMock;

        await uploadSingle(file);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, opts] = fetchMock.mock.calls[0];
        expect(url).toBe('/api/upload-single');
        expect(opts).toMatchObject({ method: 'POST' });
    });

    test('uploadChunk posts to /api/upload-chunk', async () => {
        const form = new FormData();

        const mockResp = {} as Response;
        const fetchMock = vi.fn().mockResolvedValue(mockResp);
        (globalThis as any).fetch = fetchMock;

        const res = await uploadChunk(form);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, opts] = fetchMock.mock.calls[0];
        expect(url).toBe('/api/upload-chunk');
        expect(opts).toMatchObject({ method: 'POST' });
        expect(opts.body).toBe(form);
        expect(res).toBe(mockResp);
    });
});
