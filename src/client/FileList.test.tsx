import { render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { vi, describe, test, expect } from 'vitest';

import FileList, { type FileListRef } from './FileList';

describe('FileList component', () => {
    test('renders nothing when fetch returns empty array', async () => {
        const fetchFiles = vi.fn().mockResolvedValue([]);
        render(<FileList fetchFiles={fetchFiles} />);

        await waitFor(() => {
            expect(fetchFiles).toHaveBeenCalled();
        });

        expect(screen.queryByRole('table')).toBeNull();
    });

    test('displays files returned by fetchFiles', async () => {
        const f1 = new File(['a'], 'a.txt', { type: 'text/plain' });
        const f2 = new File(['bb'], 'b.txt', { type: 'text/plain' });
        const fetchFiles = vi.fn().mockResolvedValue([f1, f2]);

        render(<FileList fetchFiles={fetchFiles} />);

        expect(await screen.findByText(f1.name)).toBeTruthy();
        expect(screen.getByText(String(f1.size))).toBeTruthy();
        expect(screen.getByText(f2.name)).toBeTruthy();
        expect(screen.getByText(String(f2.size))).toBeTruthy();
    });

    test('refetches when refetch is called via ref', async () => {
        const f1 = new File(['a'], 'initial.txt', { type: 'text/plain' });
        const f2 = new File(['abc'], 'updated.txt', { type: 'text/plain' });

        const fetchFiles = vi.fn().mockResolvedValueOnce([f1]).mockResolvedValueOnce([f2]);

        const ref = createRef<FileListRef>();
        render(<FileList fetchFiles={fetchFiles} ref={ref} />);

        // initial render shows initial file
        expect(await screen.findByText(f1.name)).toBeTruthy();

        // call refetch and wait for updated content
        ref.current?.refetch();
        expect(await screen.findByText(f2.name)).toBeTruthy();
    });

    test('alerts on fetch error', async () => {
        const fetchFiles = vi.fn().mockRejectedValue(new Error('fetch-failed'));
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

        render(<FileList fetchFiles={fetchFiles} />);

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'fetch-failed' }));
        });

        alertSpy.mockRestore();
    });
});
