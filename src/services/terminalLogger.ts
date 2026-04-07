
export const terminalLog = async (message: string, ...args: any[]) => {
    try {
        await fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                level: 'INFO',
                message,
                args
            })
        });
    } catch (e) {
        console.error('Failed to send log to terminal:', e);
    }
};

export const terminalError = async (message: string, ...args: any[]) => {
    try {
        await fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                level: 'ERROR',
                message,
                args
            })
        });
    } catch (e) {
        console.error('Failed to send error to terminal:', e);
    }
};
