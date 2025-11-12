import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import FileList from './FileList';
import useFetchFiles from './hooks/useFetchFiles';
const mockedUseFetchFiles = useFetchFiles as unknown as ReturnType<typeof vi.fn>;

describe('FileList component', () => {
    vi.mock('./hooks/useFetchFiles', () => ({ default: vi.fn() }));

    beforeEach(() => {
        mockedUseFetchFiles.mockReset();
    });
    test('should match snapshot', () => {
        mockedUseFetchFiles.mockReturnValue({
            isFetching: false,
            data: { files: [] },
            error: null,
        });

        const { asFragment } = render(<FileList />);
        expect(asFragment()).toMatchSnapshot();
    });

    test('returns null when no files are present', () => {
        mockedUseFetchFiles.mockReturnValue({
            isFetching: false,
            data: { files: [] },
            error: null,
        });

        const { container } = render(<FileList />);
        expect(container.firstChild).toBeNull();
    });

    test('renders table with files, header and sizes', () => {
        mockedUseFetchFiles.mockReturnValue({
            isFetching: false,
            data: {
                files: [
                    { name: 'a.txt', size: 1000 },
                    { name: 'b.png', size: 2048 },
                ],
            },
            error: null,
        });

        render(<FileList />);

        expect(screen.getByText('Inside folder ${projectRoot}/uploads:')).toBeTruthy();
        expect(screen.getByText('a.txt')).toBeTruthy();
        expect(screen.getByText('1000')).toBeTruthy();
        expect(screen.getByText('b.png')).toBeTruthy();
        expect(screen.getByText('2048')).toBeTruthy();
    });

    test('shows loading state when fetching', () => {
        mockedUseFetchFiles.mockReturnValue({
            isFetching: true,
            data: { files: [{ name: 'a.txt', size: 1000 }] },
            error: null,
        });

        render(<FileList />);

        expect(screen.getByText('Loading...')).toBeTruthy();
    });

    test('displays error when present', () => {
        const error = { message: 'boom' };
        mockedUseFetchFiles.mockReturnValue({
            isFetching: false,
            data: { files: [{ name: 'a.txt', size: 1000 }] },
            error,
        });

        render(<FileList />);

        expect(screen.getByText(JSON.stringify(error))).toBeTruthy();
    });
});
