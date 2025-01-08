import { useState, useEffect } from 'react';

const useResponsiveScaling = () => {
    const [scaler, setScaler] = useState(1);
    useEffect(() => {
        const adjustScaler = () => {
            const width = window.innerWidth;
            /*if (width >= 1000) {
                setScaler(1);
            } else if (width <= 500) {
                setScaler(2);
            } else setScaler(1.5);*/
            if (width >= 1000) {
                setScaler(1);
            } else {
                setScaler(width / 1000);
            }
        };

        adjustScaler();

        window.addEventListener('resize', adjustScaler, false);
        return () => {
            window.removeEventListener('resize', adjustScaler);
        };
    }, []);
    return scaler;
};

export default useResponsiveScaling;
