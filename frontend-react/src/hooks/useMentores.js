import { useState, useEffect, useCallback } from 'react'
import { fetchMentores, apiCreateMentor, apiUpdateMentor, apiDeleteMentor } from '../lib/api'

const CACHE_KEY_BASE = 'apb_mentores'

export const STATUS_OPTIONS = [
  { value: 'aberta',   label: 'Aberta' },
  { value: 'fechada',  label: 'Fechada' },
  { value: 'em_breve', label: 'Em breve' },
]

export const DEFAULT_MENTORES = [
  { id: 'W01', nome: 'Lucas Teixeira',               especialidade: 'Design & Estratégia',         bio: 'Especialista em Design Thinking e estratégia de negócios, Lucas conduz processos de inovação com foco em prototipação e validação ágil de modelos de negócio.',                                                                                                                                            calendarUrl: '', status: 'fechada' },
  { id: 'W02', nome: 'Diego Chierighini',             especialidade: 'Lean Startup',                bio: 'Empreendedor serial com experiência em metodologias ágeis e Lean Startup, Diego ajuda startups a validar hipóteses com velocidade e eficiência de recursos.',                                                                                                                                              calendarUrl: '', status: 'fechada' },
  { id: 'W03', nome: 'Lucas Branco Pulla',            especialidade: 'Marketing & Audiência',       bio: 'Especialista em persona, pesquisa de público e estratégias de posicionamento. Fundador da Sum8, ajuda startups a entender profundamente quem é o seu cliente.',                                                                                                                                           calendarUrl: '', status: 'fechada' },
  { id: 'W04', nome: 'Leonardo Rocha',                especialidade: 'Inteligência de Mercado',     bio: 'Lidera a BU de Sales & Marketing da Trillia, empresa do ecossistema B3, desenvolvendo soluções de IA e inteligência de mercado. Ex-PagBank, onde atuou em CRM e sistemas de recomendação por 3 anos.',                                                                                                   calendarUrl: '', status: 'fechada' },
  { id: 'W05', nome: 'Mariana Baima',                 especialidade: 'Comunicação Estratégica',     bio: 'Jornalista pela UFSC, com especialização em Gestão da Comunicação (FECAP) e formação em Marketing (The CMOs). Fundadora da Primeira Via Comunicação Integrada em 1999. Mais de 25 anos liderando projetos de assessoria de imprensa, inbound marketing e gestão de crises.',                             calendarUrl: '', status: 'fechada' },
  { id: 'W06', nome: 'Raphael Bonelli',               especialidade: 'Design & Identidade Visual',  bio: 'Designer gráfico com mais de 20 anos de experiência na área, professor de fotografia e design, tradutor de livros técnicos na área e certificado full-stack pela Digital Marketer.',                                                                                                                       calendarUrl: '', status: 'fechada' },
  { id: 'W07', nome: 'Saulo Messias da Silva',        especialidade: 'Planejamento Estratégico',    bio: 'Especialista em planejamento estratégico e gestão de negócios, com experiência em estruturação de OKRs, modelagem de crescimento e tomada de decisão baseada em dados.',                                                                                                                                   calendarUrl: '', status: 'fechada' },
  { id: 'W08', nome: 'Douglas Conrad',                especialidade: 'Go-to-Market',                bio: 'Sócio da OpenS, especializado em estratégias de entrada no mercado, canais de distribuição e escala comercial para startups B2B e B2C.',                                                                                                                                                                  calendarUrl: '', status: 'fechada' },
  { id: 'W09', nome: 'Fabiana Naya Silveira',         especialidade: 'Finanças',                    bio: 'Empresária, graduada em Administração pela UNIVALI, especialista em finanças corporativas. Larga experiência em gestão financeira, organização contábil, processos organizacionais e gestão de pessoas.',                                                                                                  calendarUrl: 'https://calendar.app.google/dR7NYD4PsuUkLgH56', status: 'fechada' },
  { id: 'W10', nome: 'Eduardo Jacob Murakami',        especialidade: 'Direito Empresarial',         bio: 'Advogado especializado em legislação para empreendedores, com expertise em constituição de empresas, contratos, proteção de propriedade intelectual e compliance para startups.',                                                                                                                          calendarUrl: 'https://calendar.app.google/cSCNg8FsNE8PFe4a8', status: 'fechada' },
  { id: 'W11', nome: 'Vanessa Milis Vieira',          especialidade: 'Cultura & Liderança',         bio: 'Especialista em cultura organizacional e desenvolvimento de lideranças, com foco em construção de times de alta performance e ambientes de inovação sustentável.',                                                                                                                                         calendarUrl: 'https://calendar.app.google/KgMTRzzygEqHfcuG6', status: 'fechada' },
  { id: 'W12', nome: 'Yul Ian Francesconi Gutiérrez', especialidade: 'Storytelling',                bio: 'Empreendedor formado em cinema. Sócio da produtora audiovisual ZOOME, com atuação no Brasil, Dubai, EUA e Espanha. Fundador da Yul Company (streetwear). Cursando MBA em Gestão de Projetos.',                                                                                                          calendarUrl: '', status: 'em_breve' },
  { id: 'W13', nome: 'Willian Furtado de Farias Jr.', especialidade: 'Pitch & Vendas',              bio: 'Especialista em pitch, apresentações de alto impacto e estratégias de vendas consultivas. Ajuda founders a comunicar valor, conquistar investidores e fechar contratos.',                                                                                                                                  calendarUrl: '', status: 'em_breve' },
]

function writeCache(cacheKey, data) {
  try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch {}
}

export default function useMentores(programa = 'acelera') {
  const cacheKey = `${CACHE_KEY_BASE}_${programa}`
  const fallback = programa === 'acelera' ? DEFAULT_MENTORES : []
  const [mentores, setMentores] = useState(fallback)

  const load = useCallback(async () => {
    try {
      const data = await fetchMentores(programa)
      setMentores(data)
      writeCache(cacheKey, data)
    } catch {
      // API indisponível: mantém o cache/fallback (todos os browsers veem o mesmo)
    }
  }, [programa, cacheKey])

  useEffect(() => { load() }, [load])

  async function addMentor(data) {
    await apiCreateMentor({ ...data, programa })
    await load()
  }

  async function updateMentor(id, data) {
    await apiUpdateMentor(id, data)
    await load()
  }

  async function deleteMentor(id) {
    await apiDeleteMentor(id)
    await load()
  }

  async function setMentorStatus(id, status) {
    const m = mentores.find(x => x.id === id)
    if (!m) return
    // Otimista: atualiza UI imediatamente
    setMentores(prev => prev.map(x => x.id === id ? { ...x, status } : x))
    try {
      await apiUpdateMentor(id, { ...m, status })
      await load()
    } catch (err) {
      // Rollback se o servidor falhar
      setMentores(prev => prev.map(x => x.id === id ? { ...x, status: m.status } : x))
      throw err
    }
  }

  return { mentores, addMentor, updateMentor, deleteMentor, setMentorStatus }
}
