export type DatingTip = {
  id: string
  title: string
  excerpt: string
  content: string
  category: 'first-date' | 'relationships' | 'culture' | 'communication' | 'self-improvement' | 'long-distance'
  featuredImage: string
  publishedAt: string
  readingTime: number
  tags: string[]
}

// Generate random date between Jan 1, 2025 and Dec 23, 2025
function randomDate() {
  const start = new Date('2025-01-01').getTime()
  const end = new Date('2025-12-23').getTime()
  return new Date(start + Math.random() * (end - start)).toISOString()
}

export const DATING_TIPS: DatingTip[] = [
  {
    id: 'tip-001',
    title: 'How to Make a Great First Impression on a First Date',
    excerpt: 'Learn the essential dos and don\'ts to create a memorable first impression that sets the tone for a potential relationship.',
    content: `Making a great first impression isn't about being perfect—it's about being authentic. Here are key strategies:

**1. Be Punctual and Present**
Arriving on time shows respect for your date's time. If you're running late, communicate immediately. Once there, put your phone away—nothing says "you're not important" like constant phone checking.

**2. Dress Appropriately**
Choose an outfit that matches the venue and makes you feel confident. Being overdressed or underdressed can create unnecessary awkwardness.

**3. Listen More Than You Talk**
Ask genuine questions and listen actively to the answers. People appreciate being heard. Follow up on things they mention to show you're paying attention.

**4. Share Authentic Stories**
Don't try to be someone you're not. Share stories that reveal your values, interests, and what matters to you. Authenticity creates real connection.

**5. Mind Your Body Language**
Maintain good eye contact, smile naturally, and keep an open posture. Your non-verbal communication speaks volumes about your interest and confidence.

**6. Be Confident, Not Arrogant**
There's a fine line between confidence and cockiness. Be comfortable with yourself but show genuine interest in learning about your date.

**7. Handle the Bill Gracefully**
Whether you split or one person pays, handle it smoothly. Discuss expectations beforehand if you're unsure.

**8. End on a Positive Note**
Thank them for their time, and if you're interested, express it. Clarity is kind—don't leave them guessing about your interest level.

Remember: The goal isn't to impress, it's to connect. Be yourself, be kind, and enjoy getting to know someone new.`,
    category: 'first-date',
    featuredImage: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800&auto=format&fit=crop',
    publishedAt: '2025-12-15T10:30:00.000Z',
    readingTime: 4,
    tags: ['first date', 'dating tips', 'impression']
  },
  {
    id: 'tip-002',
    title: 'Understanding Cultural Differences in African Dating',
    excerpt: 'Navigate the beautiful complexities of dating across different African cultures with confidence and respect.',
    content: `Dating across African cultures is a beautiful journey that requires cultural sensitivity, awareness, and genuine curiosity. Here's your guide:

**1. Research and Learn**
Before dating someone from a different African culture, do your homework. Learn about their traditions, values, and cultural practices. This shows respect and genuine interest.

**2. Ask Respectful Questions**
Don't assume—ask! Most people appreciate genuine curiosity about their culture. Questions like "Can you tell me about your family traditions?" show interest without being intrusive.

**3. Understand Family Expectations**
In many African cultures, family plays a central role in relationships. Understanding family dynamics, expectations, and the importance of family approval can help you navigate the relationship better.

**4. Respect Religious Practices**
Religion often intertwines with culture. Whether it's prayer times, dietary restrictions, or religious holidays, show respect and support for your partner's faith practices.

**5. Learn Key Phrases**
Learning basic greetings and phrases in your partner's language shows effort and respect. Even simple words like "hello," "thank you," and "I love you" go a long way.

**6. Embrace Cultural Celebrations**
Participate in cultural celebrations and festivals together. Whether it's attending a traditional wedding, celebrating holidays, or enjoying cultural cuisine, these shared experiences strengthen bonds.

**7. Be Open About Your Own Culture**
Cultural exchange goes both ways. Share your own cultural background, traditions, and values. This mutual sharing creates deeper understanding.

**8. Navigate Differences with Grace**
When cultural differences create misunderstandings, approach them with patience and humor. See them as opportunities to learn rather than obstacles.

**9. Find Common Ground**
While celebrating differences, also identify shared values and interests that transcend culture. These commonalities form the foundation of your relationship.

**10. Involve Family When Ready**
When the time is right, involve families in culturally appropriate ways. This might mean formal introductions, meeting at family gatherings, or following specific customs.

Remember: Cultural differences enrich relationships. Approach them with curiosity, respect, and an open heart.`,
    category: 'culture',
    featuredImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
    publishedAt: '2025-12-20T14:15:00.000Z',
    readingTime: 6,
    tags: ['culture', 'diversity', 'respect']
  },
  {
    id: 'tip-003',
    title: 'Communication Skills That Build Stronger Relationships',
    excerpt: 'Master the art of communication to create deeper connections and resolve conflicts effectively in your relationship.',
    content: `Effective communication is the foundation of every successful relationship. Here's how to master it:

**1. Practice Active Listening**
Listening isn't just waiting for your turn to talk. It's fully focusing on understanding your partner's perspective without interrupting or planning your response.

**2. Use "I" Statements**
Instead of saying "You always..." try "I feel... when..." This keeps discussions from becoming accusations and helps your partner understand your perspective without becoming defensive.

**3. Validate Feelings**
Even if you disagree, acknowledge your partner's feelings. "I can see why you'd feel that way" goes a long way in making them feel heard and valued.

**4. Be Honest but Kind**
Truth without kindness is cruelty, but kindness without truth is manipulation. Find the balance—be honest about your thoughts and feelings while being considerate of your partner's.

**5. Address Issues Early**
Don't let small frustrations build into resentment. Address concerns when they're still manageable. Small conversations prevent big blowups.

**6. Learn Each Other's Communication Styles**
Some people process verbally, others need time to think. Some are direct, others more subtle. Understanding and respecting these differences prevents misunderstandings.

**7. Schedule Regular Check-ins**
Don't wait for problems to arise. Have regular "relationship check-ins" where you discuss how things are going, what's working, and what needs attention.

**8. Show Daily Appreciation**
Communication isn't just about solving problems. Regularly express appreciation, gratitude, and love. "Thank you for..." and "I appreciate how you..." build positive communication patterns.

**9. Manage Conflict Constructively**
During disagreements, stick to the issue at hand. Don't bring up past problems or resort to personal attacks. Take breaks if emotions run high.

**10. Use Non-Verbal Communication Wisely**
Your body language, tone, and facial expressions communicate as much as your words. Make sure they align with what you're saying.

**11. Ask Questions Instead of Assuming**
When something bothers you, ask questions to understand rather than jumping to conclusions. "Can you help me understand..." opens dialogue.

**12. Create Safe Spaces for Vulnerability**
Both partners should feel safe sharing fears, insecurities, and dreams without judgment. This vulnerability deepens intimacy.

Remember: Communication is a skill that improves with practice. Be patient with yourself and your partner as you both grow.`,
    category: 'communication',
    featuredImage: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=800&auto=format&fit=crop',
    publishedAt: '2025-12-18T09:45:00.000Z',
    readingTime: 5,
    tags: ['communication', 'relationships', 'connection']
  },
]
