import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Bot, Database, Send, Sparkles } from 'lucide-react'
import { useSelection } from '../context/SelectionContext'
import { money } from '../utils/format'

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  text: string
  tag?: string
}

const initialSampleMessages: ChatMessage[] = [
  {
    id: 'm1',
    role: 'assistant',
    tag: 'SAMPLE PLANT BRIEFING',
    text: 'ToolWise AI Assistance is active across 5 sample CNC machines in Plant 01 (VMC Alpha, MillTurn 500, VF-4SS, Nexturn 320, and DMC 635).',
  },
  {
    id: 'm2',
    role: 'assistant',
    tag: 'COST, TIME & SCRAP ALERT',
    text: 'Priority Sample Insight: CNC-05 (TL-009) has 18 min RUL left (VB 0.27/0.35 mm) and CNC-04 (TL-005) has 29 min RUL left on Inconel 718. A 3-minute planned swap on both saves ₹1,59,490 in avoided scrap, holder damage, and 201 minutes of unplanned spindle delay.',
  },
  {
    id: 'm3',
    role: 'user',
    text: 'Compare replacement cost vs. failure loss across our sample machines.',
  },
  {
    id: 'm4',
    role: 'assistant',
    tag: 'INR (₹) & DELAY COMPARISON',
    text: 'Across the 5 sample bays: Planned between-cycle replacements cost ₹4,980–₹12,780 (3 min pause, 0 damaged parts), whereas mid-cut tool breakage costs ₹64,200–₹94,600 (96–108 min delay + 2–3 scrapped parts).',
  },
]

export default function AiAssistance() {
  const { fleetMachines, fleetTools } = useSelection()

  const [aiEnabled, setAiEnabled] = useState(true)
  const [aiThreshold, setAiThreshold] = useState('75')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(initialSampleMessages)

  const sendChat = (promptText: string) => {
    const trimmed = promptText.trim()
    if (!trimmed) return
    const q = trimmed.toLowerCase()
    let reply = `Sample Plant Summary: ${fleetMachines.length} machines and ${fleetTools.length} tools monitored. Total avoided failure loss today: ₹2,26,700 and 294 minutes of spindle downtime.`
    if (q.includes('change') || q.includes('tool') || q.includes('first') || q.includes('urgent')) {
      reply = `1) Replace TL-009 on CNC-05 immediately (18m RUL, VB 0.27/0.35 mm — 3m swap at ₹12,780 prevents ₹94,600 loss & 105m delay). 2) Stage TL-005 on CNC-04 before part #9 (29m RUL on Inconel 718 — saves ₹77,670).`
    } else if (q.includes('save') || q.includes('cost') || q.includes('rupee') || q.includes('scrap')) {
      reply = `Planned 3-minute tool swaps across CNC-01, CNC-04, and CNC-05 cost ₹27,140 total vs. ₹2,55,900 in mid-cut breakage, 8 scrapped billets, and holder damage — a net savings of ₹2,28,760 (${money(620)} per cycle).`
    } else if (q.includes('batch') || q.includes('material') || q.includes('queue')) {
      reply = `Batch Clearance Check: AISI 4140 on CNC-01 (44 parts / 59m left) is cleared with 71m RUL. Inconel 718 on CNC-04 (5 parts / 36m left) exceeds 29m RUL — auto-stage sister tool in pocket T03.`
    } else if (q.includes('delay') || q.includes('minute') || q.includes('time')) {
      reply = `A planned between-cycle swap takes 3 minutes. An unplanned mid-cut breakage causes 96–108 minutes of spindle stop, broken insert extraction, bore re-probing, and part scrap.`
    }
    setMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: trimmed },
      { id: `a-${Date.now() + 1}`, role: 'assistant', tag: 'AI SAMPLE ADVISOR', text: reply },
    ])
    setChatInput('')
  }

  return (
    <Stack spacing={3}>
      {/* Top Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ md: 'center' }}
        spacing={2}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
            <Chip
              size="small"
              icon={<Database size={13} />}
              label="PRE-LOADED WITH SAMPLE AI DECISION DATA"
              sx={{
                bgcolor: 'rgba(59,130,246,0.14)',
                color: '#1565C0',
                border: '1px solid #BFDBFE',
                fontWeight: 800,
                fontSize: 11,
              }}
            />
          </Stack>
          <Typography variant="h4" fontWeight={800}>
            AI Assistance
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>
            Interactive AI tooling chatbot for replacement costs (₹), production delays (min), and part-damage prevention.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            startIcon={<Sparkles size={14} />}
            onClick={() => setMessages(initialSampleMessages)}
          >
            Reset Sample Conversation
          </Button>
          <FormControlLabel
            control={<Switch checked={aiEnabled} onChange={e => setAiEnabled(e.target.checked)} />}
            label={<Typography variant="body2" fontWeight={700}>Auto-Advisor On</Typography>}
          />
        </Stack>
      </Stack>

      {/* Highlighted Hero AI Chatbot Console */}
      <Card
        sx={{
          bgcolor: '#14181D',
          border: '2px solid #1565C0',
          borderRadius: 3.5,
          boxShadow: '0 20px 44px -18px rgba(21,101,192,0.18)',
          overflow: 'hidden',
        }}
      >
        {/* Top Highlighted Chatbot Banner */}
        <Box
          sx={{
            px: 3,
            py: 2.25,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.14) 0%, #14181D 100%)',
            borderBottom: '1px solid #BFDBFE',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            spacing={1.5}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2.5,
                  bgcolor: '#1565C0',
                  color: '#FFFFFF',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 8px 20px -6px rgba(21,101,192,0.45)',
                }}
              >
                <Bot size={24} />
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#F8FAFC' }}>
                    ToolWise AI Chatbot &amp; Decision Advisor
                  </Typography>
                  <Chip
                    size="small"
                    label="LIVE COPILOT"
                    sx={{
                      bgcolor: '#1565C0',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: 10.5,
                      height: 20,
                    }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Ask about sample machine wear, replacement costs (₹), production delays (min), and batch clearance
                </Typography>
              </Box>
            </Stack>

            <Chip
              size="small"
              icon={<Sparkles size={13} />}
              label="5 Sample CNC Streams Indexed"
              sx={{
                bgcolor: '#14181D',
                color: '#1565C0',
                border: '1px solid #93C5FD',
                fontWeight: 800,
              }}
            />
          </Stack>
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={2}>
                <TextField
                  select
                  label="Wear Alert Trigger (% VB)"
                  fullWidth
                  size="small"
                  value={aiThreshold}
                  onChange={e => setAiThreshold(e.target.value)}
                >
                  <MenuItem value="65">65% VB (Conservative)</MenuItem>
                  <MenuItem value="75">75% VB (Recommended)</MenuItem>
                  <MenuItem value="85">85% VB (Aggressive)</MenuItem>
                </TextField>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.25,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    borderColor: '#BFDBFE',
                  }}
                >
                  <Typography variant="caption" fontWeight={800} color="primary.main" display="block" mb={1.25}>
                    SAMPLE DATA PROMPTS (CLICK TO ASK)
                  </Typography>
                  <Stack spacing={1}>
                    {[
                      'Which machine needs a tool change first?',
                      'How much rupee scrap cost can we save today?',
                      'How many minutes of delay does a planned swap save?',
                      'Check batch material queue clearance',
                    ].map(q => (
                      <Button
                        key={q}
                        size="small"
                        variant="outlined"
                        onClick={() => sendChat(q)}
                        sx={{
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          fontWeight: 700,
                          bgcolor: '#14181D',
                          borderColor: '#CBD5E1',
                          '&:hover': {
                            bgcolor: 'rgba(59,130,246,0.14)',
                            borderColor: '#1565C0',
                          },
                        }}
                      >
                        {q}
                      </Button>
                    ))}
                  </Stack>
                </Paper>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, lg: 8 }}>
              <Stack
                spacing={1.5}
                sx={{
                  height: 410,
                  overflowY: 'auto',
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  mb: 1.75,
                }}
              >
                {messages.map(m => (
                  <Box
                    key={m.id}
                    sx={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                      px: 2,
                      py: 1.35,
                      borderRadius: 2.5,
                      bgcolor: m.role === 'user' ? '#1D4ED8' : 'rgba(255,255,255,0.06)',
                      color: '#F8FAFC',
                      border: m.role === 'user' ? 'none' : '1px solid #BFDBFE',
                      boxShadow:
                        m.role === 'user'
                          ? '0 8px 18px -6px rgba(21,101,192,0.35)'
                          : '0 4px 12px -4px rgba(15,23,42,0.06)',
                    }}
                  >
                    {m.tag && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          fontSize: 10.5,
                          letterSpacing: '0.05em',
                          color: m.role === 'user' ? '#BFDBFE' : '#1565C0',
                          display: 'block',
                          mb: 0.4,
                        }}
                      >
                        {m.tag}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: 14, lineHeight: 1.55 }}>{m.text}</Typography>
                  </Box>
                ))}
              </Stack>

              <Stack direction="row" spacing={1.25}>
                <TextField
                  size="medium"
                  fullWidth
                  placeholder="Ask the ToolWise AI Chatbot about any sample machine, tool wear, ₹ cost, or batch..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      sendChat(chatInput)
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#14181D',
                      borderRadius: 2.5,
                    },
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={() => sendChat(chatInput)}
                  sx={{
                    bgcolor: '#1565C0',
                    color: '#FFFFFF',
                    borderRadius: 2.5,
                    px: 2.5,
                    boxShadow: '0 8px 18px -6px rgba(21,101,192,0.45)',
                    '&:hover': { bgcolor: '#0D47A1' },
                  }}
                >
                  <Send size={18} />
                </IconButton>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  )
}
