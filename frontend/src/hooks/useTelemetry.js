import { useState, useEffect } from 'react';

export default function useTelemetry() {
    const [telemetry, setTelemetry] = useState({
        battery: 100,
        charging: false,
        networkType: 'unknown',
        networkSpeed: 'unknown',
        cores: navigator.hardwareConcurrency || 4,
        online: navigator.onLine
    });

    useEffect(() => {
        // BATTERY STATUS
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                const updateBattery = () => {
                    setTelemetry(prev => ({
                        ...prev,
                        battery: Math.round(battery.level * 100),
                        charging: battery.charging
                    }));
                };

                updateBattery();
                battery.addEventListener('levelchange', updateBattery);
                battery.addEventListener('chargingchange', updateBattery);
            });
        }

        // NETWORK STATUS
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            const updateNetwork = () => {
                setTelemetry(prev => ({
                    ...prev,
                    networkType: connection.effectiveType || '4g',
                    networkSpeed: connection.downlink ? `${connection.downlink} Mbps` : 'Unknown'
                }));
            };
            updateNetwork();
            connection.addEventListener('change', updateNetwork);
        }

        // ONLINE STATUS
        const updateOnline = () => {
            setTelemetry(prev => ({ ...prev, online: navigator.onLine }));
        };
        window.addEventListener('online', updateOnline);
        window.addEventListener('offline', updateOnline);

        return () => {
            window.removeEventListener('online', updateOnline);
            window.removeEventListener('offline', updateOnline);
        };
    }, []);

    return telemetry;
}
