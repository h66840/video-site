/**
 * 响应式编程范式示例：前端高并发视频数据处理
 * Reactive Programming Example: Frontend High-Concurrency Video Data Processing
 * 
 * 这个示例展示了如何在前端使用RxJS实现响应式编程，
 * 处理视频上传、实时预览、批量处理等高并发场景。
 * 
 * 为初级工程师提供的学习示例
 */

// 首先需要安装依赖：npm install rxjs

import { 
  Observable, 
  Subject, 
  BehaviorSubject,
  fromEvent, 
  from, 
  of,
  merge,
  combineLatest,
  timer,
  EMPTY
} from 'rxjs';

import {
  map,
  filter,
  debounceTime,
  throttleTime,
  switchMap,
  mergeMap,
  concatMap,
  catchError,
  retry,
  take,
  takeUntil,
  share,
  startWith,
  scan,
  distinctUntilChanged,
  bufferTime,
  bufferCount
} from 'rxjs/operators';

// 数据类型定义
interface VideoFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
}

interface ProcessingResult {
  videoId: string;
  thumbnails: string[];
  duration: number;
  metadata: VideoMetadata;
  processedAt: Date;
}

interface VideoMetadata {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  codec: string;
}

interface UploadProgress {
  videoId: string;
  progress: number;
  speed: number; // bytes per second
  remainingTime: number; // seconds
}

/**
 * 响应式视频处理服务
 */
class ReactiveVideoService {
  // 状态管理流
  private videoQueue$ = new BehaviorSubject<VideoFile[]>([]);
  private uploadProgress$ = new Subject<UploadProgress>();
  private processingResults$ = new Subject<ProcessingResult>();
  private errors$ = new Subject<Error>();
  
  // 配置
  private readonly MAX_CONCURRENT_UPLOADS = 3;
  private readonly MAX_CONCURRENT_PROCESSING = 2;
  private readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  
  constructor() {
    this.setupProcessingPipeline();
  }
  
  /**
   * 设置响应式处理管道
   */
  private setupProcessingPipeline(): void {
    // 1. 视频上传流水线
    this.videoQueue$.pipe(
      // 过滤出待上传的视频
      map(videos => videos.filter(v => v.status === 'pending')),
      // 控制并发上传数量
      switchMap(pendingVideos => 
        from(pendingVideos).pipe(
          mergeMap(video => this.uploadVideo(video), this.MAX_CONCURRENT_UPLOADS)
        )
      ),
      // 错误处理
      catchError(error => {
        this.errors$.next(error);
        return EMPTY;
      })
    ).subscribe();
    
    // 2. 视频处理流水线
    this.uploadProgress$.pipe(
      // 只处理上传完成的视频
      filter(progress => progress.progress === 100),
      map(progress => progress.videoId),
      // 控制并发处理数量
      mergeMap(videoId => this.processVideo(videoId), this.MAX_CONCURRENT_PROCESSING),
      // 错误处理和重试
      retry(3),
      catchError(error => {
        this.errors$.next(error);
        return EMPTY;
      })
    ).subscribe(result => {
      this.processingResults$.next(result);
    });
  }
  
  /**
   * 添加视频到处理队列
   */
  addVideos(files: FileList): void {
    const currentQueue = this.videoQueue$.value;
    const newVideos: VideoFile[] = Array.from(files).map(file => ({
      id: this.generateId(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadProgress: 0,
      status: 'pending'
    }));
    
    this.videoQueue$.next([...currentQueue, ...newVideos]);
  }
  
  /**
   * 响应式视频上传
   */
  private uploadVideo(video: VideoFile): Observable<UploadProgress> {
    return new Observable<UploadProgress>(observer => {
      const startTime = Date.now();
      let uploadedBytes = 0;
      
      // 更新视频状态
      this.updateVideoStatus(video.id, 'uploading');
      
      // 模拟分块上传
      const uploadChunk = (chunkIndex: number) => {
        const start = chunkIndex * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE, video.file.size);
        const chunk = video.file.slice(start, end);
        
        // 模拟网络延迟
        setTimeout(() => {
          uploadedBytes += chunk.size;
          const progress = (uploadedBytes / video.file.size) * 100;
          const elapsedTime = (Date.now() - startTime) / 1000;
          const speed = uploadedBytes / elapsedTime;
          const remainingBytes = video.file.size - uploadedBytes;
          const remainingTime = remainingBytes / speed;
          
          const progressData: UploadProgress = {
            videoId: video.id,
            progress: Math.round(progress),
            speed,
            remainingTime
          };
          
          observer.next(progressData);
          
          if (progress >= 100) {
            this.updateVideoStatus(video.id, 'processing');
            observer.complete();
          } else {
            uploadChunk(chunkIndex + 1);
          }
        }, Math.random() * 100 + 50); // 50-150ms 随机延迟
      };
      
      uploadChunk(0);
    }).pipe(
      share() // 共享流，避免重复执行
    );
  }
  
  /**
   * 响应式视频处理
   */
  private processVideo(videoId: string): Observable<ProcessingResult> {
    return timer(2000 + Math.random() * 3000).pipe( // 2-5秒处理时间
      map(() => {
        // 模拟视频处理结果
        const result: ProcessingResult = {
          videoId,
          thumbnails: [
            `thumbnail_${videoId}_1.jpg`,
            `thumbnail_${videoId}_2.jpg`,
            `thumbnail_${videoId}_3.jpg`
          ],
          duration: Math.random() * 300 + 60, // 1-6分钟
          metadata: {
            width: 1920,
            height: 1080,
            fps: 30,
            bitrate: 5000000,
            codec: 'h264'
          },
          processedAt: new Date()
        };
        
        this.updateVideoStatus(videoId, 'completed');
        return result;
      }),
      catchError(error => {
        this.updateVideoStatus(videoId, 'error');
        throw error;
      })
    );
  }
  
  /**
   * 获取实时统计信息
   */
  getRealtimeStats(): Observable<any> {
    return combineLatest([
      this.videoQueue$,
      this.uploadProgress$.pipe(startWith(null)),
      this.processingResults$.pipe(startWith(null))
    ]).pipe(
      map(([videos, uploadProgress, processingResult]) => {
        const stats = {
          total: videos.length,
          pending: videos.filter(v => v.status === 'pending').length,
          uploading: videos.filter(v => v.status === 'uploading').length,
          processing: videos.filter(v => v.status === 'processing').length,
          completed: videos.filter(v => v.status === 'completed').length,
          errors: videos.filter(v => v.status === 'error').length,
          currentUpload: uploadProgress,
          lastProcessed: processingResult
        };
        return stats;
      }),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );
  }
  
  /**
   * 获取上传进度流
   */
  getUploadProgress(): Observable<UploadProgress[]> {
    return this.uploadProgress$.pipe(
      scan((acc: UploadProgress[], current: UploadProgress) => {
        const existingIndex = acc.findIndex(p => p.videoId === current.videoId);
        if (existingIndex >= 0) {
          acc[existingIndex] = current;
        } else {
          acc.push(current);
        }
        return acc.filter(p => p.progress < 100); // 只保留未完成的
      }, []),
      startWith([])
    );
  }
  
  /**
   * 获取处理结果流
   */
  getProcessingResults(): Observable<ProcessingResult[]> {
    return this.processingResults$.pipe(
      scan((acc: ProcessingResult[], current: ProcessingResult) => {
        return [...acc, current];
      }, []),
      startWith([])
    );
  }
  
  /**
   * 获取错误流
   */
  getErrors(): Observable<Error[]> {
    return this.errors$.pipe(
      scan((acc: Error[], current: Error) => {
        return [...acc, current];
      }, []),
      startWith([])
    );
  }
  
  // 辅助方法
  private updateVideoStatus(videoId: string, status: VideoFile['status']): void {
    const currentQueue = this.videoQueue$.value;
    const updatedQueue = currentQueue.map(video => 
      video.id === videoId ? { ...video, status } : video
    );
    this.videoQueue$.next(updatedQueue);
  }
  
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

/**
 * 响应式UI控制器
 */
class ReactiveVideoUI {
  private videoService: ReactiveVideoService;
  private destroy$ = new Subject<void>();
  
  constructor() {
    this.videoService = new ReactiveVideoService();
    this.setupUI();
  }
  
  private setupUI(): void {
    // 1. 文件拖拽上传
    this.setupDragAndDrop();
    
    // 2. 实时统计显示
    this.setupRealtimeStats();
    
    // 3. 进度条更新
    this.setupProgressBars();
    
    // 4. 结果展示
    this.setupResultsDisplay();
    
    // 5. 错误处理
    this.setupErrorHandling();
  }
  
  private setupDragAndDrop(): void {
    const dropZone = document.getElementById('drop-zone');
    if (!dropZone) return;
    
    // 防止默认拖拽行为
    fromEvent<DragEvent>(dropZone, 'dragover').pipe(
      takeUntil(this.destroy$)
    ).subscribe(e => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    
    fromEvent<DragEvent>(dropZone, 'dragleave').pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      dropZone.classList.remove('drag-over');
    });
    
    // 处理文件拖拽
    fromEvent<DragEvent>(dropZone, 'drop').pipe(
      takeUntil(this.destroy$),
      map(e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        return e.dataTransfer?.files;
      }),
      filter(files => files !== undefined && files.length > 0)
    ).subscribe(files => {
      this.videoService.addVideos(files!);
    });
    
    // 处理文件选择
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fromEvent<Event>(fileInput, 'change').pipe(
        takeUntil(this.destroy$),
        map(e => (e.target as HTMLInputElement).files),
        filter(files => files !== null && files.length > 0)
      ).subscribe(files => {
        this.videoService.addVideos(files!);
      });
    }
  }
  
  private setupRealtimeStats(): void {
    const statsElement = document.getElementById('stats');
    if (!statsElement) return;
    
    this.videoService.getRealtimeStats().pipe(
      takeUntil(this.destroy$),
      throttleTime(100) // 限制更新频率
    ).subscribe(stats => {
      statsElement.innerHTML = `
        <div class="stat-item">总计: ${stats.total}</div>
        <div class="stat-item">等待中: ${stats.pending}</div>
        <div class="stat-item">上传中: ${stats.uploading}</div>
        <div class="stat-item">处理中: ${stats.processing}</div>
        <div class="stat-item">已完成: ${stats.completed}</div>
        <div class="stat-item">错误: ${stats.errors}</div>
      `;
    });
  }
  
  private setupProgressBars(): void {
    const progressContainer = document.getElementById('progress-container');
    if (!progressContainer) return;
    
    this.videoService.getUploadProgress().pipe(
      takeUntil(this.destroy$)
    ).subscribe(progressList => {
      progressContainer.innerHTML = progressList.map(progress => `
        <div class="progress-item">
          <div class="progress-label">视频 ${progress.videoId}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress.progress}%"></div>
          </div>
          <div class="progress-info">
            ${progress.progress}% - 
            ${this.formatSpeed(progress.speed)} - 
            剩余 ${this.formatTime(progress.remainingTime)}
          </div>
        </div>
      `).join('');
    });
  }
  
  private setupResultsDisplay(): void {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;
    
    this.videoService.getProcessingResults().pipe(
      takeUntil(this.destroy$)
    ).subscribe(results => {
      resultsContainer.innerHTML = results.map(result => `
        <div class="result-item">
          <h3>视频 ${result.videoId}</h3>
          <p>时长: ${this.formatDuration(result.duration)}</p>
          <p>分辨率: ${result.metadata.width}x${result.metadata.height}</p>
          <p>帧率: ${result.metadata.fps}fps</p>
          <div class="thumbnails">
            ${result.thumbnails.map(thumb => `<img src="${thumb}" alt="缩略图">`).join('')}
          </div>
          <p>处理时间: ${result.processedAt.toLocaleString()}</p>
        </div>
      `).join('');
    });
  }
  
  private setupErrorHandling(): void {
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) return;
    
    this.videoService.getErrors().pipe(
      takeUntil(this.destroy$)
    ).subscribe(errors => {
      if (errors.length > 0) {
        errorContainer.innerHTML = errors.map(error => `
          <div class="error-item">
            <strong>错误:</strong> ${error.message}
          </div>
        `).join('');
        errorContainer.style.display = 'block';
      } else {
        errorContainer.style.display = 'none';
      }
    });
  }
  
  // 辅助方法
  private formatSpeed(bytesPerSecond: number): string {
    const mbps = bytesPerSecond / (1024 * 1024);
    return `${mbps.toFixed(2)} MB/s`;
  }
  
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // 清理资源
  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// 使用示例
document.addEventListener('DOMContentLoaded', () => {
  const videoUI = new ReactiveVideoUI();
  
  // 页面卸载时清理资源
  window.addEventListener('beforeunload', () => {
    videoUI.destroy();
  });
});

// 导出供其他模块使用
export { ReactiveVideoService, ReactiveVideoUI };