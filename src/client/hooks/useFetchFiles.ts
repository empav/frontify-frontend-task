import { useCallback, useEffect, useImperativeHandle, useState } from 'react';

import { type FileListRef } from '../FileList';
import { fetchFiles } from '../api';
import { type FetchFilesResponse } from '../types';

const useFetchFiles = (ref: React.ForwardedRef<FileListRef>) => {
    const [data, setData] = useState<FetchFilesResponse>({ files: [] });
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const fetch = useCallback(() => {
        setIsFetching(true);

        fetchFiles()
            .then((resp) => setData(resp))
            .catch((error) => setError(error))
            .finally(() => setIsFetching(false));
    }, []);

    // fetch data when component mounts
    useEffect(() => {
        fetch();
    }, [fetch]);

    // Refetch data when parent component trigger refetch
    useImperativeHandle(ref, () => ({
        refetch: fetch,
    }));

    return { data, setData, refetch: fetch, error, isFetching };
};

export default useFetchFiles;
