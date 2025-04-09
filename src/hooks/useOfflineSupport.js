import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function useOfflineSupport() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isServerUp, setIsServerUp] = useState(true);
    const [pendingOperations, setPendingOperations] = useState(
        JSON.parse(localStorage.getItem('pendingOperations') || '[]')
    );
    const [isProcessing, setIsProcessing] = useState(false);

    // Detect network status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Check server status
    useEffect(() => {
        const checkServer = async () => {
            if (!isOnline) {
                setIsServerUp(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:5002/api/mice', { method: 'HEAD' });
                setIsServerUp(response.ok);
            } catch {
                setIsServerUp(false);
            }
        };

        checkServer();
        const interval = setInterval(checkServer, 5000);
        return () => clearInterval(interval);
    }, [isOnline]);

    // Process pending operations when online and server is up
    useEffect(() => {
        if (isOnline && isServerUp && pendingOperations.length > 0 && !isProcessing) {
            processPendingOperations();
        }
    }, [isOnline, isServerUp, pendingOperations.length, isProcessing]);

    // Process pending operations
    const processPendingOperations = useCallback(async () => {
        if (!isOnline || !isServerUp || pendingOperations.length === 0 || isProcessing) return;

        setIsProcessing(true);

        try {
            const op = pendingOperations[0];

            try {
                switch (op.type) {
                    case 'ADD_MOUSE':
                        await axios.post('http://localhost:5002/api/mice', op.data);
                        break;

                    case 'UPDATE_MOUSE':
                        await axios.patch(`http://localhost:5002/api/mice/${op.data.id}`, op.data);
                        break;

                    case 'DELETE_MOUSE':
                        await axios.delete(`http://localhost:5002/api/mice/${op.data.id}`);
                        break;

                    default:
                        console.warn('Unknown operation type:', op.type);
                }

                // Remove the processed operation
                setPendingOperations(prev => prev.slice(1));

                // Refresh cache after successful operation
                const response = await fetch('http://localhost:5002/api/mice');
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('cachedMice', JSON.stringify(data));
                }
            } catch (error) {
                console.error(`Failed to process operation: ${op.type}`, error);

                // Retry logic: Add a retry count to the operation
                const retryCount = op.retryCount || 0;
                if (retryCount < 3) {
                    setPendingOperations(prev => [
                        ...prev.slice(1),
                        { ...op, retryCount: retryCount + 1 }
                    ]);
                } else {
                    console.error(`Operation failed after 3 retries: ${op.type}`);
                    setPendingOperations(prev => prev.slice(1)); // Remove after max retries
                }
            }
        } finally {
            setIsProcessing(false);
        }
    }, [isOnline, isServerUp, pendingOperations, isProcessing]);

    // Save pending operations to localStorage
    useEffect(() => {
        localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations));
    }, [pendingOperations]);

    // Add a new pending operation
    const addPendingOperation = (type, data) => {
        const operation = { id: `op_${Date.now()}`, type, data, timestamp: Date.now() };
        setPendingOperations(prev => [...prev, operation]);
    };

    return {
        isOnline,
        isServerUp,
        isOfflineMode: !isOnline || !isServerUp,
        pendingOperations,
        addPendingOperation
    };
}

export default useOfflineSupport;