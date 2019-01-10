import { createLocalTracks, LocalTrack, LocalVideoTrack } from 'twilio-video';
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { StorageService } from '../services/storage.service';

@Component({
    selector: 'app-camera',
    styleUrls: ['./camera.component.css'],
    templateUrl: './camera.component.html',
})
export class CameraComponent implements AfterViewInit {
    @ViewChild('preview') previewElement: ElementRef;

    get tracks(): LocalTrack[] {
        return this.localTracks;
    }

    isInitializing: boolean = true;

    private preview: HTMLDivElement;
    private videoTrack: LocalVideoTrack;
    private localTracks: LocalTrack[] = [];

    constructor(private readonly storageService: StorageService) { }

    async ngAfterViewInit() {
        if (this.previewElement && this.previewElement.nativeElement) {
            this.preview = this.previewElement.nativeElement as HTMLDivElement;
            const selectedVideoInput = this.storageService.get('videoInputId');
            await this.initializeDevice('videoinput', selectedVideoInput);
        }
    }

    initializePreview(deviceInfo?: MediaDeviceInfo) {
        if (deviceInfo) {
            this.initializeDevice(deviceInfo.kind, deviceInfo.deviceId);
        } else {
            this.initializeDevice();
        }
    }

    finalizePreview() {
        try {
            if (this.videoTrack) {
                this.videoTrack.detach().forEach(element => element.remove());
            }
        } catch (e) {
            console.error(e);
        }
    }

    private async initializeDevice(kind?: MediaDeviceKind, deviceId?: string) {
        try {
            this.isInitializing = true;

            if (this.videoTrack) {
                this.videoTrack.detach().forEach(element => element.remove());
            }

            this.localTracks = kind && deviceId
                ? await this.initializeTracks(kind, deviceId)
                : await this.initializeTracks();

            this.videoTrack = this.localTracks.find(t => t.kind === 'video') as LocalVideoTrack;
            const videoElement = this.videoTrack.attach();
            this.preview
                .getAttributeNames()
                .filter(attr => attr.startsWith('_ng'))
                .forEach(a => videoElement.setAttribute(a, ''));
            this.preview.appendChild(videoElement);
        } finally {
            this.isInitializing = false;
        }
    }

    private initializeTracks(kind?: MediaDeviceKind, deviceId?: string) {
        if (kind) {
            switch (kind) {
                case 'audioinput':
                    return createLocalTracks({ audio: { deviceId }, video: true });
                case 'videoinput':
                    return createLocalTracks({ audio: true, video: { deviceId } });
            }
        }

        return createLocalTracks({ audio: true, video: true });
    }
}