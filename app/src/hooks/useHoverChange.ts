import {
    useCallback,
    useEffect,
    useRef,
} from 'react';

function useHoverChange<T>(
    id: T,
    onHoverChange: (id: T | undefined) => void,
) {
    const hoveredRef = useRef(false);

    const handleMouseEnter = useCallback(() => {
        hoveredRef.current = true;
        onHoverChange(id);
    }, [id, onHoverChange]);

    const handleMouseLeave = useCallback(() => {
        hoveredRef.current = false;
        onHoverChange(undefined);
    }, [onHoverChange]);

    useEffect(() => () => {
        if (hoveredRef.current) {
            onHoverChange(undefined);
        }
    }, [onHoverChange]);

    return { handleMouseEnter, handleMouseLeave };
}

export default useHoverChange;
