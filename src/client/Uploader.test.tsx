import { render } from '@testing-library/react';
import { forwardRef } from 'react';
import { describe, expect, test, vi } from 'vitest';

import Uploader from './Uploader';

// Mock FileList component (optional if not testing it directly)
vi.mock('./FileList', () => ({
    __esModule: true,
    // eslint-disable-next-line react/display-name
    default: forwardRef(() => <div data-testid="file-list" />),
}));

// Mock fetchFiles import
vi.mock('./api', () => ({
    fetchFiles: vi.fn(),
}));

describe('Uploader component', () => {
    describe('Single/Multiple', () => {
        test('should match snapshot', () => {
            const { asFragment } = render(<Uploader />);
            expect(asFragment()).toMatchSnapshot();
        });
    });
    describe('Chunked', () => {
        test('should match snapshot', () => {
            const { asFragment } = render(<Uploader chunked />);
            expect(asFragment()).toMatchSnapshot();
        });
    });
});
