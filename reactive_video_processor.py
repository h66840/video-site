"""
响应式编程范式示例：高并发视频数据处理
Reactive Programming Paradigm Example: High-Concurrency Video Data Processing

这个示例展示了如何使用响应式编程范式来重构传统的同步视频处理代码，
以解决高并发场景下的性能瓶颈问题。

作者：为初级工程师提供的学习示例
"""

import asyncio
import time
from typing import AsyncGenerator, Callable, Any, List
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class VideoFrame:
    """视频帧数据结构"""
    frame_id: int
    data: bytes
    timestamp: float
    metadata: dict

@dataclass
class ProcessedFrame:
    """处理后的视频帧"""
    frame_id: int
    processed_data: bytes
    processing_time: float
    original_timestamp: float

class ReactiveVideoStream:
    """响应式视频流处理器"""
    
    def __init__(self, max_concurrent_tasks: int = 10):
        self.max_concurrent_tasks = max_concurrent_tasks
        self.semaphore = asyncio.Semaphore(max_concurrent_tasks)
        self.executor = ThreadPoolExecutor(max_workers=max_concurrent_tasks)
        
    async def create_video_stream(self, video_source: str) -> AsyncGenerator[VideoFrame, None]:
        """
        创建响应式视频流
        模拟从视频源读取帧数据
        """
        logger.info(f"开始创建视频流: {video_source}")
        
        # 模拟视频帧生成
        for frame_id in range(100):  # 模拟100帧
            # 模拟从视频源读取数据的延迟
            await asyncio.sleep(0.01)  # 10ms延迟模拟I/O操作
            
            frame = VideoFrame(
                frame_id=frame_id,
                data=f"frame_data_{frame_id}".encode(),
                timestamp=time.time(),
                metadata={"source": video_source, "format": "h264"}
            )
            
            yield frame
    
    async def process_frame_async(self, frame: VideoFrame) -> ProcessedFrame:
        """
        异步处理单个视频帧
        使用信号量控制并发数量，避免资源耗尽
        """
        async with self.semaphore:
            start_time = time.time()
            
            # 模拟CPU密集型处理（在线程池中执行）
            loop = asyncio.get_event_loop()
            processed_data = await loop.run_in_executor(
                self.executor, 
                self._cpu_intensive_processing, 
                frame.data
            )
            
            processing_time = time.time() - start_time
            
            return ProcessedFrame(
                frame_id=frame.frame_id,
                processed_data=processed_data,
                processing_time=processing_time,
                original_timestamp=frame.timestamp
            )
    
    def _cpu_intensive_processing(self, data: bytes) -> bytes:
        """
        模拟CPU密集型处理（图像滤镜、编码等）
        """
        # 模拟处理时间
        time.sleep(0.05)  # 50ms处理时间
        return f"processed_{data.decode()}".encode()
    
    async def apply_transformations(
        self, 
        stream: AsyncGenerator[VideoFrame, None],
        transformations: List[Callable[[VideoFrame], VideoFrame]]
    ) -> AsyncGenerator[VideoFrame, None]:
        """
        对视频流应用变换操作（响应式操作符）
        """
        async for frame in stream:
            # 应用所有变换
            transformed_frame = frame
            for transform in transformations:
                transformed_frame = transform(transformed_frame)
            yield transformed_frame
    
    async def filter_frames(
        self, 
        stream: AsyncGenerator[VideoFrame, None],
        predicate: Callable[[VideoFrame], bool]
    ) -> AsyncGenerator[VideoFrame, None]:
        """
        过滤视频流（响应式过滤操作符）
        """
        async for frame in stream:
            if predicate(frame):
                yield frame
    
    async def batch_process(
        self, 
        stream: AsyncGenerator[VideoFrame, None],
        batch_size: int = 5
    ) -> AsyncGenerator[List[ProcessedFrame], None]:
        """
        批量处理视频帧（响应式批处理操作符）
        """
        batch = []
        async for frame in stream:
            batch.append(frame)
            
            if len(batch) >= batch_size:
                # 并发处理整个批次
                tasks = [self.process_frame_async(frame) for frame in batch]
                processed_batch = await asyncio.gather(*tasks)
                yield processed_batch
                batch = []
        
        # 处理剩余的帧
        if batch:
            tasks = [self.process_frame_async(frame) for frame in batch]
            processed_batch = await asyncio.gather(*tasks)
            yield processed_batch

class VideoProcessingPipeline:
    """响应式视频处理管道"""
    
    def __init__(self):
        self.stream_processor = ReactiveVideoStream(max_concurrent_tasks=20)
        self.error_count = 0
        self.processed_count = 0
    
    async def create_processing_pipeline(self, video_sources: List[str]):
        """
        创建完整的响应式处理管道
        """
        logger.info("启动响应式视频处理管道")
        start_time = time.time()
        
        # 为每个视频源创建处理任务
        tasks = []
        for source in video_sources:
            task = asyncio.create_task(self._process_single_source(source))
            tasks.append(task)
        
        # 并发处理所有视频源
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        total_time = time.time() - start_time
        
        # 统计结果
        successful_results = [r for r in results if not isinstance(r, Exception)]
        failed_results = [r for r in results if isinstance(r, Exception)]
        
        logger.info(f"处理完成！")
        logger.info(f"总耗时: {total_time:.2f}秒")
        logger.info(f"成功处理: {len(successful_results)}个视频源")
        logger.info(f"失败: {len(failed_results)}个视频源")
        logger.info(f"总处理帧数: {self.processed_count}")
        
        return {
            "total_time": total_time,
            "successful": len(successful_results),
            "failed": len(failed_results),
            "total_frames": self.processed_count
        }
    
    async def _process_single_source(self, video_source: str):
        """处理单个视频源"""
        try:
            # 创建视频流
            video_stream = self.stream_processor.create_video_stream(video_source)
            
            # 应用变换：只处理偶数帧（模拟帧率降低）
            filtered_stream = self.stream_processor.filter_frames(
                video_stream,
                lambda frame: frame.frame_id % 2 == 0
            )
            
            # 批量处理
            batch_stream = self.stream_processor.batch_process(filtered_stream, batch_size=5)
            
            # 处理每个批次
            async for processed_batch in batch_stream:
                self.processed_count += len(processed_batch)
                
                # 模拟保存处理结果
                await self._save_processed_frames(processed_batch, video_source)
                
                logger.info(f"[{video_source}] 处理了 {len(processed_batch)} 帧")
        
        except Exception as e:
            self.error_count += 1
            logger.error(f"处理视频源 {video_source} 时出错: {e}")
            raise
    
    async def _save_processed_frames(self, frames: List[ProcessedFrame], source: str):
        """模拟保存处理后的帧"""
        # 模拟异步I/O操作
        await asyncio.sleep(0.01)
        
        # 这里可以实现实际的保存逻辑
        # 例如：保存到数据库、文件系统或发送到其他服务
        pass

# 传统同步处理方式（对比用）
class TraditionalVideoProcessor:
    """传统同步视频处理器（用于性能对比）"""
    
    def process_videos_sync(self, video_sources: List[str]):
        """同步处理多个视频源"""
        logger.info("启动传统同步视频处理")
        start_time = time.time()
        
        total_frames = 0
        for source in video_sources:
            frames = self._generate_frames(source, 50)  # 生成50帧
            for frame in frames:
                # 同步处理每一帧
                self._process_frame_sync(frame)
                total_frames += 1
        
        total_time = time.time() - start_time
        logger.info(f"同步处理完成！耗时: {total_time:.2f}秒，处理帧数: {total_frames}")
        return {"total_time": total_time, "total_frames": total_frames}
    
    def _generate_frames(self, source: str, count: int) -> List[VideoFrame]:
        """生成视频帧"""
        frames = []
        for i in range(count):
            frame = VideoFrame(
                frame_id=i,
                data=f"frame_data_{i}".encode(),
                timestamp=time.time(),
                metadata={"source": source}
            )
            frames.append(frame)
        return frames
    
    def _process_frame_sync(self, frame: VideoFrame):
        """同步处理单帧"""
        # 模拟处理时间
        time.sleep(0.05)  # 50ms处理时间

# 使用示例和性能对比
async def main():
    """主函数：演示响应式编程的优势"""
    
    # 模拟多个视频源
    video_sources = [f"video_source_{i}" for i in range(5)]
    
    print("=" * 60)
    print("响应式编程 vs 传统同步处理 - 性能对比")
    print("=" * 60)
    
    # 1. 响应式处理
    print("\n🚀 开始响应式处理...")
    pipeline = VideoProcessingPipeline()
    reactive_result = await pipeline.create_processing_pipeline(video_sources)
    
    # 2. 传统同步处理
    print("\n🐌 开始传统同步处理...")
    traditional_processor = TraditionalVideoProcessor()
    sync_result = traditional_processor.process_videos_sync(video_sources)
    
    # 3. 性能对比
    print("\n" + "=" * 60)
    print("📊 性能对比结果:")
    print("=" * 60)
    print(f"响应式处理:")
    print(f"  - 耗时: {reactive_result['total_time']:.2f}秒")
    print(f"  - 处理帧数: {reactive_result['total_frames']}")
    print(f"  - 平均每帧: {reactive_result['total_time']/reactive_result['total_frames']*1000:.2f}ms")
    
    print(f"\n传统同步处理:")
    print(f"  - 耗时: {sync_result['total_time']:.2f}秒")
    print(f"  - 处理帧数: {sync_result['total_frames']}")
    print(f"  - 平均每帧: {sync_result['total_time']/sync_result['total_frames']*1000:.2f}ms")
    
    speedup = sync_result['total_time'] / reactive_result['total_time']
    print(f"\n⚡ 性能提升: {speedup:.2f}x")
    
    print("\n" + "=" * 60)
    print("🎯 响应式编程的关键优势:")
    print("=" * 60)
    print("1. 并发处理：同时处理多个视频流")
    print("2. 异步I/O：不阻塞主线程")
    print("3. 背压控制：通过信号量控制并发数量")
    print("4. 流式处理：数据流动式处理，内存效率高")
    print("5. 错误隔离：单个流的错误不影响其他流")
    print("6. 可组合性：操作符可以灵活组合")

if __name__ == "__main__":
    # 运行示例
    asyncio.run(main())