import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { createReadStream, watch, statSync } from 'fs';
import { join } from 'path';

@WebSocketGateway()
export class LogGateway {
	@WebSocketServer() server: Server;
	private logFilePath = join(__dirname, '../path/to/your/logfile.log'); // 替换为你的 log 文件路径
	private lastFileSize = 0; // 保存上次读取的文件大小

	constructor() {
		// 初始化文件大小
		this.lastFileSize = statSync(this.logFilePath).size;

		// 监听日志文件的变化
		watch(this.logFilePath, (eventType) => {
			if (eventType === 'change') {
				this.readNewLogData();
			}
		});
	}

	private readNewLogData() {
		const currentFileSize = statSync(this.logFilePath).size;

		// 只有在文件大小增加的情况下才读取新数据
		if (currentFileSize > this.lastFileSize) {
			const logStream = createReadStream(this.logFilePath, {
				start: this.lastFileSize, // 从上次读取的结束位置开始
				end: currentFileSize, // 读取到当前文件末尾
				encoding: 'utf-8',
			});

			let newLogs = '';
			logStream.on('data', (chunk) => {
				newLogs += chunk;
			});

			logStream.on('end', () => {
				this.server.emit('logUpdate', newLogs);
				this.lastFileSize = currentFileSize; // 更新上次读取的文件大小
			});
		}
	}
}
