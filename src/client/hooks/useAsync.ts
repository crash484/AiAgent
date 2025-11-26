import { useCallback, useEffect, useState, type DependencyList } from "react";

export const useAsync = <T>(
  callback: () => Promise<T>,
  dependencies: DependencyList = [],
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const [value, setValue] = useState<T | undefined>();

  const callbackMemoized = useCallback(() => {
    setLoading(true);
    setError(undefined);
    setValue(undefined);
    callback()
      .then(setValue)
      .catch(setError)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  useEffect(() => {
    callbackMemoized();
  }, [callbackMemoized]);

  return { loading, error, value };
};
