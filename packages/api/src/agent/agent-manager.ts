import { spawn, ChildProcess } from 'child_process';
import { generateToken } from '../routers/get-token';

interface AgentInstance {
    roomName: string;
    process: ChildProcess;
    startedAt: Date;
}

class AgentManager {
    private agents: Map<string, AgentInstance> = new Map();

    async spawnAgent(roomName: string): Promise<{ success: boolean; message: string }> {
        // Check if agent already exists for this room
        if (this.agents.has(roomName)) {
            return {
                success: false,
                message: 'Agent already active for this room',
            };
        }

        try {
            // Generate token for the agent
            const agentToken = await generateToken({
                roomName,
                userName: 'AI-Assistant',
            });

            // Set environment variables for the agent
            const env = {
                ...process.env,
                LIVEKIT_URL: process.env.LIVEKIT_URL || '',
                LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY || '',
                LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET || '',
                GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
                AGENT_ROOM_NAME: roomName,
                AGENT_TOKEN: agentToken,
            };

            // Spawn the agent process using full bun path
            const bunPath = process.env.BUN_PATH || '/Users/samarsayed/.bun/bin/bun';
            const agentProcess = spawn(bunPath, ['run', 'dev'], {
                cwd: process.cwd() + '/packages/agent',
                env,
                stdio: ['ignore', 'pipe', 'pipe'],
            });

            // Log agent output
            agentProcess.stdout?.on('data', (data) => {
                console.log(`[Agent ${roomName}]:`, data.toString());
            });

            agentProcess.stderr?.on('data', (data) => {
                console.error(`[Agent ${roomName} Error]:`, data.toString());
            });

            agentProcess.on('exit', (code) => {
                console.log(`[Agent ${roomName}] Process exited with code ${code}`);
                this.agents.delete(roomName);
            });

            // Store agent instance
            this.agents.set(roomName, {
                roomName,
                process: agentProcess,
                startedAt: new Date(),
            });

            console.log(`[AgentManager] Spawned agent for room: ${roomName}`);

            return {
                success: true,
                message: 'Agent started successfully',
            };
        } catch (error) {
            console.error('[AgentManager] Error spawning agent:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to spawn agent',
            };
        }
    }

    async stopAgent(roomName: string): Promise<{ success: boolean; message: string }> {
        const agent = this.agents.get(roomName);

        if (!agent) {
            return {
                success: false,
                message: 'No agent found for this room',
            };
        }

        try {
            agent.process.kill('SIGTERM');
            this.agents.delete(roomName);

            console.log(`[AgentManager] Stopped agent for room: ${roomName}`);

            return {
                success: true,
                message: 'Agent stopped successfully',
            };
        } catch (error) {
            console.error('[AgentManager] Error stopping agent:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to stop agent',
            };
        }
    }

    getAgentStatus(roomName: string): { active: boolean; startedAt?: Date } {
        const agent = this.agents.get(roomName);

        if (agent) {
            return {
                active: true,
                startedAt: agent.startedAt,
            };
        }

        return {
            active: false,
        };
    }

    stopAllAgents(): void {
        console.log('[AgentManager] Stopping all agents');

        for (const [roomName, agent] of this.agents.entries()) {
            try {
                agent.process.kill('SIGTERM');
                console.log(`[AgentManager] Stopped agent for room: ${roomName}`);
            } catch (error) {
                console.error(`[AgentManager] Error stopping agent for ${roomName}:`, error);
            }
        }

        this.agents.clear();
    }
}

// Singleton instance
export const agentManager = new AgentManager();

// Cleanup on process exit
process.on('SIGTERM', () => {
    agentManager.stopAllAgents();
});

process.on('SIGINT', () => {
    agentManager.stopAllAgents();
    process.exit(0);
});
