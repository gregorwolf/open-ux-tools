import { isAppStudio } from '@sap-ux/btp-utils';
import type { TelemetryEvent, TelemetryProperties, ToolsSuiteTelemetryClient } from '@sap-ux/telemetry';
import { SampleRate } from '@sap-ux/telemetry';
import osName from 'os-name';
import { hostEnvironment } from '../types';
import { PromptState } from './prompt-state';

const osVersionName = osName();

/**
 * Determine if the current prompting environment is cli or a hosted extension (app studio or vscode).
 *
 * @returns the platform name and technical name
 */
export function getPlatform(): { name: string; technical: string } {
    if (!PromptState.isYUI) {
        return hostEnvironment.cli;
    } else {
        return isAppStudio() ? hostEnvironment.bas : hostEnvironment.vscode;
    }
}

let telemetryClient: ToolsSuiteTelemetryClient | undefined;

/**
 * Set the telemetry client.
 *
 * @param toolsSuiteTelemetryClient the telemetry client instance to use when sending telemetry events
 */
export function setTelemetryClient(toolsSuiteTelemetryClient: ToolsSuiteTelemetryClient | undefined): void {
    telemetryClient = toolsSuiteTelemetryClient;
}

/**
 * Send telemetry event.
 *
 * @param eventName the name of the telemetry event
 * @param telemetryData the telemetry values to report
 */
export function sendTelemetryEvent(eventName: string, telemetryData: TelemetryProperties): void {
    const telemetryEvent = createTelemetryEvent(eventName, telemetryData);
    if (telemetryClient) {
        /* eslint-disable @typescript-eslint/no-floating-promises */
        telemetryClient.reportEvent(telemetryEvent, SampleRate.NoSampling);
    }
}

/**
 * Create telemetry event.
 *
 * @param eventName the name of the telemetry event
 * @param telemetryData the telemetry values to add to he returned telemetry event
 * @returns the telemetry event
 */
function createTelemetryEvent(eventName: string, telemetryData: TelemetryProperties): TelemetryEvent {
    const telemProps: TelemetryProperties = Object.assign(telemetryData, {
        Platform: getPlatform().technical,
        OperatingSystem: osVersionName
    });
    return {
        eventName,
        properties: telemProps,
        measurements: {}
    };
}

export { PromptState };
