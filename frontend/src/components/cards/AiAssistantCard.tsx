import { useEffect, useState } from 'react'
import { Box, Button, Card, CardContent, Chip, IconButton, Stack, TextField, Typography } from '@mui/material'
import { Bot, Send, Sparkles } from 'lucide-react'
import type { Job, Machine, Material, Tool } from '../../data'
import { money } from '../../utils/format'

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
}

export function AiAssistantCard({
  machine,
  tool,
  material,
  job,
  actualTimeMin,
  predictedTimeMin,
  score,
  savings,
}: {
  machine: Machine
  tool: Tool
  material: Material
  job: Job
  actualTimeMin: number
  predictedTimeMin: number
  score: number
  savings: number
}) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    const initial: ChatMessage[] = [
      {
        id: 'init-1',
        role: 'assistant',
        text:
          predictedTimeMin <= 0
            ? `Alert for ${machine.id}: Predicted remaining tool time is 0 min (Score: 0/100). Replace ${tool.id} (${tool.name}) immediately before starting the next part on ${material.name}.`
            : `${machine.id} is running ${tool.id} on ${material.name}. Actual cut time is ${actualTimeMin} min with ${predictedTimeMin} min predicted remaining (Score: ${score}/100).`,
      },
      {
        id: 'init-2',
        role: 'assistant',
        text:
          score < 55
            ? `Suggestion: Stage a sister tool in pocket ${tool.pocket} now. Planned replacement saves ~${money(savings)} compared to unplanned breakage.`
            : `Suggestion: Cutting parameters (${job.feed} mm/rev, ${job.coolant}) are stable. Re-check flank wear after ${Math.max(10, Math.round(predictedTimeMin / 2))} min.`,
      },
    ]
    setMessages(initial)
  }, [machine.id, tool.id, tool.name, tool.pocket, material.name, actualTimeMin, predictedTimeMin, score, savings, job.feed, job.coolant])

  const buildReply = (prompt: string): string => {
    const q = prompt.toLowerCase()
    if (q.includes('replace') || q.includes('change') || q.includes('when')) {
      return predictedTimeMin <= 0
        ? `Replace ${tool.id} right now — predicted remaining time is 0 min and continuing risks part scrap and holder damage.`
        : `Recommended change window: within the next ${predictedTimeMin} min of cut time (current VB wear is ${job.vbWearMm.toFixed(2)} / ${tool.vb_limit_mm.toFixed(2)} mm).`
    }
    if (q.includes('wear') || q.includes('speed') || q.includes('reduce')) {
      return `For ${material.name} (${material.hardness}), keep cutting speed within ${material.vcMin}–${material.vcMax} m/min and maintain ${material.factoryContext.coolantStrategy} to hold flank wear below ${tool.vb_limit_mm.toFixed(2)} mm.`
    }
    if (q.includes('cost') || q.includes('save') || q.includes('break')) {
      return `Replacing ${tool.id} on schedule costs ~${money(tool.cost)} for the tool, while running to failure risks scrap and downtime — saving ~${money(savings)} per cycle.`
    }
    return `For ${machine.id} (${tool.id} on ${material.name}): Actual time is ${actualTimeMin} min, predicted remaining time is ${predictedTimeMin} min, and Tool Score is ${score}/100.`
  }

  const sendPrompt = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed }
    const botMsg: ChatMessage = { id: `a-${Date.now() + 1}`, role: 'assistant', text: buildReply(trimmed) }
    setMessages(prev => [...prev, userMsg, botMsg])
    setInput('')
  }

  const quickPrompts = [
    'When should I replace this tool?',
    'How to reduce flank wear?',
    'What is the cost impact?',
  ]

  return (
    <Card sx={{ bgcolor: '#14181D', border: '1px solid rgba(255,255,255,0.08)' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: 'rgba(21,101,192,.10)',
                color: 'primary.main',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Bot size={20} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontSize: 17, fontWeight: 800 }}>
                AI Tooling Suggestions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Live recommendations for {machine.id} · {tool.id}
              </Typography>
            </Box>
          </Stack>
          <Chip
            size="small"
            icon={<Sparkles size={13} />}
            label="AI Assistant"
            sx={{ bgcolor: 'rgba(21,101,192,.08)', color: 'primary.main', fontWeight: 700 }}
          />
        </Stack>

        <Stack
          spacing={1.25}
          sx={{
            maxHeight: 220,
            overflowY: 'auto',
            p: 1.75,
            borderRadius: 2.5,
            bgcolor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            mb: 1.75,
          }}
        >
          {messages.map(msg => (
            <Box
              key={msg.id}
              sx={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                px: 1.75,
                py: 1.1,
                borderRadius: 2,
                bgcolor: msg.role === 'user' ? '#1D4ED8' : 'rgba(255,255,255,0.06)',
                color: '#F8FAFC',
                border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Typography sx={{ fontSize: 13.5, lineHeight: 1.5 }}>{msg.text}</Typography>
            </Box>
          ))}
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={1.75}>
          {quickPrompts.map(q => (
            <Button
              key={q}
              size="small"
              variant="outlined"
              onClick={() => sendPrompt(q)}
              sx={{ borderRadius: 999, textTransform: 'none', fontSize: 12.5, fontWeight: 600 }}
            >
              {q}
            </Button>
          ))}
        </Stack>

        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            fullWidth
            placeholder="Ask AI about tool wear, replacement timing, or cost..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                sendPrompt(input)
              }
            }}
          />
          <IconButton
            color="primary"
            onClick={() => sendPrompt(input)}
            sx={{ bgcolor: 'primary.main', color: '#FFFFFF', borderRadius: 2, px: 1.75, '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <Send size={16} />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  )
}
