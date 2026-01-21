
/**
 * Transforms generic URLs into direct image URLs where possible.
 * Specifically handles Google Drive viewer links.
 */
export function getDirectImageUrl(url: string | undefined | null): string | undefined {
    if (!url) return undefined;

    // Handle Google Drive Viewer Links
    // from: https://drive.google.com/file/d/1XRpY1tMPWI1cA3.../view
    // to: https://drive.google.com/uc?export=view&id=1XRpY1tMPWI1cA3...
    if (url.includes('drive.google.com') && url.includes('/file/d/')) {
        const idMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) {
            return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
        }
    }

    return url;
}
