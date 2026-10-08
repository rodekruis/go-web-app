import { createContext } from 'react';

export interface NrwCapturedImage {
    dataUrl: string;
    aspectRatio: number;
}

export type NrwScreenshotHandler = () => Promise<NrwCapturedImage>;

export interface NrwScreenshotContextProps {
    takeScreenshot: NrwScreenshotHandler | undefined;
}

const NrwScreenshotContext = createContext<NrwScreenshotContextProps>({
    takeScreenshot: undefined,
});

export default NrwScreenshotContext;
