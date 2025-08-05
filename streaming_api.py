"""
实时视频流API端点
提供WebRTC和HTTP流媒体支持的视频流服务
"""

from flask import Flask, Response, request, jsonify
import cv2
import threading
import time
import json
from datetime import datetime

app = Flask(__name__)

class VideoStreamer:
    def __init__(self):
        self.active_streams = {}
        self.stream_lock = threading.Lock()
    
    def generate_stream(self, stream_id):
        """生成视频流数据"""
        # 这里可以连接到实际的视频源
        # 目前使用模拟数据
        while stream_id in self.active_streams:
            # 模拟视频帧数据
            frame_data = f"Frame data for stream {stream_id} at {datetime.now()}"
            yield f"data: {frame_data}\n\n"
            time.sleep(0.033)  # ~30 FPS
    
    def start_stream(self, stream_id, source=None):
        """启动新的视频流"""
        with self.stream_lock:
            if stream_id not in self.active_streams:
                self.active_streams[stream_id] = {
                    'source': source,
                    'start_time': datetime.now(),
                    'status': 'active'
                }
                return True
            return False
    
    def stop_stream(self, stream_id):
        """停止视频流"""
        with self.stream_lock:
            if stream_id in self.active_streams:
                del self.active_streams[stream_id]
                return True
            return False

streamer = VideoStreamer()

@app.route('/api/v1/stream/start', methods=['POST'])
def start_stream():
    """
    启动实时视频流
    POST /api/v1/stream/start
    Body: {"stream_id": "unique_id", "source": "camera_url_or_file"}
    """
    data = request.get_json()
    stream_id = data.get('stream_id')
    source = data.get('source', 'default')
    
    if not stream_id:
        return jsonify({'error': 'stream_id is required'}), 400
    
    if streamer.start_stream(stream_id, source):
        return jsonify({
            'message': 'Stream started successfully',
            'stream_id': stream_id,
            'stream_url': f'/api/v1/stream/{stream_id}'
        }), 200
    else:
        return jsonify({'error': 'Stream already exists'}), 409

@app.route('/api/v1/stream/<stream_id>')
def get_stream(stream_id):
    """
    获取实时视频流
    GET /api/v1/stream/{stream_id}
    返回Server-Sent Events格式的视频流
    """
    if stream_id not in streamer.active_streams:
        return jsonify({'error': 'Stream not found'}), 404
    
    return Response(
        streamer.generate_stream(stream_id),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        }
    )

@app.route('/api/v1/stream/<stream_id>/stop', methods=['POST'])
def stop_stream(stream_id):
    """
    停止实时视频流
    POST /api/v1/stream/{stream_id}/stop
    """
    if streamer.stop_stream(stream_id):
        return jsonify({'message': 'Stream stopped successfully'}), 200
    else:
        return jsonify({'error': 'Stream not found'}), 404

@app.route('/api/v1/streams', methods=['GET'])
def list_streams():
    """
    列出所有活跃的视频流
    GET /api/v1/streams
    """
    with streamer.stream_lock:
        streams = []
        for stream_id, info in streamer.active_streams.items():
            streams.append({
                'stream_id': stream_id,
                'source': info['source'],
                'start_time': info['start_time'].isoformat(),
                'status': info['status'],
                'stream_url': f'/api/v1/stream/{stream_id}'
            })
    
    return jsonify({'streams': streams}), 200

@app.route('/api/v1/stream/<stream_id>/info', methods=['GET'])
def get_stream_info(stream_id):
    """
    获取特定视频流的信息
    GET /api/v1/stream/{stream_id}/info
    """
    if stream_id not in streamer.active_streams:
        return jsonify({'error': 'Stream not found'}), 404
    
    info = streamer.active_streams[stream_id]
    return jsonify({
        'stream_id': stream_id,
        'source': info['source'],
        'start_time': info['start_time'].isoformat(),
        'status': info['status'],
        'stream_url': f'/api/v1/stream/{stream_id}'
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)