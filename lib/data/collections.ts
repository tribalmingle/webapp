import { z } from 'zod'

import { buildJsonSchema, objectIdSchema, withTimestamps, type CollectionDefinition } from './collection-helpers'

const phoneRegex = /^\+[0-9]{8,15}$/
const geoHashRegex = /^[a-z0-9]{5,12}$/i

const consentLogSchema = z.object({
	version: z.string(),
	acceptedAt: z.date(),
	channel: z.enum(['web', 'mobile', 'email', 'sms']).optional(),
	ip: z.string().ip({ version: 'v4' }).optional(),
})

const trustedDeviceSchema = z.object({
	deviceId: z.string(),
	pushToken: z.string().optional(),
	lastSeenAt: z.date().optional(),
	geoHash: z.string().regex(geoHashRegex).optional(),
})

const mfaFactorSchema = z.object({
	type: z.enum(['totp', 'sms', 'email', 'passkey']),
	verifiedAt: z.date().optional(),
})

const userSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	email: z.string().email(),
	phone: z.string().regex(phoneRegex).optional(),
	passwordHash: z.string().min(60).max(255),
	socialProviders: z.array(z.object({ provider: z.string(), externalId: z.string() })).default([]),
	roles: z.array(z.string()).min(1).default(['member']),
	status: z.enum(['pending', 'active', 'suspended', 'deleted']).default('pending'),
	signupSource: z.string().default('organic'),
	consentLogs: z.array(consentLogSchema).default([]),
	trustedDevices: z.array(trustedDeviceSchema).default([]),
	mfaFactors: z.array(mfaFactorSchema).default([]),
	authRiskScore: z.number().min(0).max(1).default(0.5),
})

const usersDefinition: CollectionDefinition<typeof userSchema> = {
	name: 'users',
	schema: userSchema,
	validator: buildJsonSchema(
		{
			email: { bsonType: 'string', description: 'Unique email address' },
			phone: { bsonType: 'string' },
			passwordHash: { bsonType: 'string' },
			socialProviders: {
				bsonType: 'array',
				items: { bsonType: 'object', properties: { provider: { bsonType: 'string' }, externalId: { bsonType: 'string' } }, required: ['provider', 'externalId'] },
			},
			roles: { bsonType: 'array', items: { bsonType: 'string' } },
			status: { bsonType: 'string', enum: ['pending', 'active', 'suspended', 'deleted'] },
			signupSource: { bsonType: 'string' },
			consentLogs: {
				bsonType: 'array',
				items: {
					bsonType: 'object',
					required: ['version', 'acceptedAt'],
					properties: {
						version: { bsonType: 'string' },
						acceptedAt: { bsonType: 'date' },
						channel: { bsonType: 'string' },
						ip: { bsonType: 'string' },
					},
				},
			},
			trustedDevices: {
				bsonType: 'array',
				items: {
					bsonType: 'object',
					required: ['deviceId'],
					properties: {
						deviceId: { bsonType: 'string' },
						pushToken: { bsonType: 'string' },
						lastSeenAt: { bsonType: 'date' },
						geoHash: { bsonType: 'string' },
					},
				},
			},
			mfaFactors: {
				bsonType: 'array',
				items: {
					bsonType: 'object',
					required: ['type'],
					properties: {
						type: { bsonType: 'string', enum: ['totp', 'sms', 'email', 'passkey'] },
						verifiedAt: { bsonType: 'date' },
					},
				},
			},
			authRiskScore: { bsonType: 'double' },
		},
		['email', 'passwordHash', 'status'],
	),
	indexes: [
		{ key: { email: 1 }, unique: true, name: 'email_unique' },
		{ key: { phone: 1 }, unique: true, name: 'phone_unique', partialFilterExpression: { phone: { $exists: true } } },
		{ key: { roles: 1 }, name: 'roles_idx' },
		{ key: { status: 1, createdAt: -1 }, name: 'status_created_idx' },
	],
}

const languageSchema = z.object({ code: z.string().min(2).max(5), proficiency: z.enum(['basic', 'conversational', 'fluent', 'native']) })
const promptResponseSchema = z.object({ promptId: z.string(), answer: z.string(), media: z.string().url().optional() })
const mediaItemSchema = z.object({ url: z.string().url(), type: z.enum(['photo', 'video']), flagged: z.boolean().default(false) })

const profileSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	userId: objectIdSchema,
	name: z.string().min(2),
	gender: z.string(),
	pronouns: z.string().optional(),
	dob: z.date(),
	tribe: z.string(),
	clan: z.string().optional(),
	languages: z.array(languageSchema).min(1),
	location: z.object({ city: z.string(), country: z.string(), lat: z.number(), lng: z.number() }),
	bio: z.string().max(1000).optional(),
	mediaGallery: z.array(mediaItemSchema).max(12),
	promptResponses: z.array(promptResponseSchema).max(6),
	culturalValues: z.object({ spirituality: z.number().min(0).max(5), family: z.number().min(0).max(5), tradition: z.number().min(0).max(5), modernity: z.number().min(0).max(5) }),
	faithPractice: z.string().optional(),
	diet: z.string().optional(),
	marriageTimeline: z.string().optional(),
	childrenPreference: z.string().optional(),
	verificationStatus: z.object({ selfie: z.boolean(), id: z.boolean(), social: z.boolean(), background: z.boolean(), badgeIssuedAt: z.date().optional() }),
	visibility: z.object({ incognito: z.boolean().default(false), hideAge: z.boolean().default(false), hideDistance: z.boolean().default(false) }),
	blockedUserIds: z.array(objectIdSchema).default([]),
})

const profilesDefinition: CollectionDefinition<typeof profileSchema> = {
	name: 'profiles',
	schema: profileSchema,
	validator: buildJsonSchema(
		{
			userId: { bsonType: 'objectId' },
			name: { bsonType: 'string' },
			gender: { bsonType: 'string' },
			pronouns: { bsonType: 'string' },
			dob: { bsonType: 'date' },
			tribe: { bsonType: 'string' },
			clan: { bsonType: 'string' },
			languages: {
				bsonType: 'array',
				items: {
					bsonType: 'object',
					required: ['code', 'proficiency'],
					properties: { code: { bsonType: 'string' }, proficiency: { bsonType: 'string' } },
				},
			},
			location: {
				bsonType: 'object',
				required: ['city', 'country', 'lat', 'lng'],
				properties: {
					city: { bsonType: 'string' },
					country: { bsonType: 'string' },
					lat: { bsonType: 'double' },
					lng: { bsonType: 'double' },
				},
			},
			bio: { bsonType: 'string' },
			mediaGallery: {
				bsonType: 'array',
				items: {
					bsonType: 'object',
					required: ['url', 'type'],
					properties: {
						url: { bsonType: 'string' },
						type: { bsonType: 'string', enum: ['photo', 'video'] },
						flagged: { bsonType: 'bool' },
					},
				},
			},
			promptResponses: {
				bsonType: 'array',
				items: {
					bsonType: 'object',
					required: ['promptId', 'answer'],
					properties: {
						promptId: { bsonType: 'string' },
						answer: { bsonType: 'string' },
						media: { bsonType: 'string' },
					},
				},
			},
			culturalValues: {
				bsonType: 'object',
				properties: {
					spirituality: { bsonType: 'double' },
					family: { bsonType: 'double' },
					tradition: { bsonType: 'double' },
					modernity: { bsonType: 'double' },
				},
			},
			faithPractice: { bsonType: 'string' },
			diet: { bsonType: 'string' },
			marriageTimeline: { bsonType: 'string' },
			childrenPreference: { bsonType: 'string' },
			verificationStatus: {
				bsonType: 'object',
				properties: {
					selfie: { bsonType: 'bool' },
					id: { bsonType: 'bool' },
					social: { bsonType: 'bool' },
					background: { bsonType: 'bool' },
					badgeIssuedAt: { bsonType: 'date' },
				},
			},
			visibility: {
				bsonType: 'object',
				properties: {
					incognito: { bsonType: 'bool' },
					hideAge: { bsonType: 'bool' },
					hideDistance: { bsonType: 'bool' },
				},
			},
			blockedUserIds: { bsonType: 'array', items: { bsonType: 'objectId' } },
		},
		['userId', 'name', 'gender', 'dob', 'tribe', 'languages', 'location'],
	),
	indexes: [
		{ key: { userId: 1 }, unique: true, name: 'user_unique' },
		{ key: { tribe: 1, gender: 1 }, name: 'tribe_gender_idx' },
		{ key: { 'location.country': 1 }, name: 'country_idx' },
		{ key: { createdAt: -1 }, name: 'profiles_created_idx' },
	],
}

const compatibilitySchema = withTimestamps({
	_id: objectIdSchema.optional(),
	userId: objectIdSchema,
	version: z.string(),
	responses: z.array(z.object({ promptId: z.string(), value: z.number().min(0).max(5), note: z.string().optional() })),
	personaTags: z.array(z.string()).default([]),
	embedding: z.array(z.number()).length(256).optional(),
	completedAt: z.date(),
})

const compatibilityDefinition: CollectionDefinition<typeof compatibilitySchema> = {
	name: 'compatibility_quizzes',
	schema: compatibilitySchema,
	validator: buildJsonSchema(
		{
			userId: { bsonType: 'objectId' },
			version: { bsonType: 'string' },
			responses: {
				bsonType: 'array',
				items: {
					bsonType: 'object',
					required: ['promptId', 'value'],
					properties: {
						promptId: { bsonType: 'string' },
						value: { bsonType: 'double' },
						note: { bsonType: 'string' },
					},
				},
			},
			personaTags: { bsonType: 'array', items: { bsonType: 'string' } },
			embedding: { bsonType: 'array', items: { bsonType: 'double' } },
			completedAt: { bsonType: 'date' },
		},
		['userId', 'version', 'responses', 'completedAt'],
	),
	indexes: [
		{ key: { userId: 1, version: -1 }, name: 'quiz_user_version_idx' },
		{ key: { completedAt: -1 }, name: 'quiz_completed_idx' },
	],
}

const candidateSchema = z.object({
	candidateId: objectIdSchema,
	score: z.number().min(0).max(1),
	rank: z.number().int().min(1),
	scoreBreakdown: z.record(z.string(), z.number()).optional(),
	metadata: z.record(z.string(), z.any()).optional(),
})

const matchingSnapshotSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	userId: objectIdSchema,
	algorithmVersion: z.string(),
	generatedAt: z.date(),
	candidates: z.array(candidateSchema).max(200),
})

const matchingSnapshotsDefinition: CollectionDefinition<typeof matchingSnapshotSchema> = {
	name: 'matching_snapshots',
	schema: matchingSnapshotSchema,
	validator: buildJsonSchema(
		{
			userId: { bsonType: 'objectId' },
			algorithmVersion: { bsonType: 'string' },
			generatedAt: { bsonType: 'date' },
			candidates: {
				bsonType: 'array',
				items: {
					bsonType: 'object',
					required: ['candidateId', 'score', 'rank'],
					properties: {
						candidateId: { bsonType: 'objectId' },
						score: { bsonType: 'double' },
						rank: { bsonType: 'int' },
								scoreBreakdown: { bsonType: 'object' },
								metadata: { bsonType: 'object' },
					},
				},
			},
		},
		['userId', 'algorithmVersion', 'generatedAt', 'candidates'],
	),
	indexes: [
		{ key: { userId: 1, generatedAt: -1 }, name: 'snapshot_user_generated_idx' },
		{ key: { generatedAt: 1 }, name: 'snapshot_ttl_idx', expireAfterSeconds: 60 * 60 * 24 * 7 },
	],
}

const recipeFilterSchema = z.object({
	verifiedOnly: z.boolean().default(false),
	faithPractice: z.string().optional(),
	lifeGoals: z.array(z.string()).default([]),
	travelMode: z.enum(['home', 'passport']).default('home'),
	onlineNow: z.boolean().default(false),
	guardianApproved: z.boolean().default(false),
	custom: z.record(z.string(), z.any()).optional(),
})

const discoveryRecipeSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	userId: objectIdSchema,
	name: z.string().min(2),
	filters: recipeFilterSchema.default({ verifiedOnly: false, travelMode: 'home', lifeGoals: [] }),
	isDefault: z.boolean().default(false),
	lastUsedAt: z.date().optional(),
})

const discoveryRecipesDefinition: CollectionDefinition<typeof discoveryRecipeSchema> = {
	name: 'discovery_recipes',
	schema: discoveryRecipeSchema,
	validator: buildJsonSchema(
		{
			userId: { bsonType: 'objectId' },
			name: { bsonType: 'string' },
			filters: { bsonType: 'object' },
			isDefault: { bsonType: 'bool' },
			lastUsedAt: { bsonType: 'date' },
		},
		['userId', 'name', 'filters'],
	),
	indexes: [
		{ key: { userId: 1, name: 1 }, name: 'recipe_user_name_unique', unique: true },
		{ key: { userId: 1, isDefault: 1 }, name: 'recipe_default_idx', partialFilterExpression: { isDefault: true } },
	],
}

const interactionEventSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	actorId: objectIdSchema,
	targetId: objectIdSchema.optional(),
	event: z.enum(['like', 'super_like', 'rewind', 'match_confirmed', 'view', 'filter_saved']).default('view'),
	source: z.string().default('discovery'),
	metadata: z.record(z.string(), z.any()).default({}),
	dedupeKey: z.string().optional(),
	occurredAt: z.date().optional(),
})

const interactionEventsDefinition: CollectionDefinition<typeof interactionEventSchema> = {
	name: 'interaction_events',
	schema: interactionEventSchema,
	validator: buildJsonSchema(
		{
			actorId: { bsonType: 'objectId' },
			targetId: { bsonType: 'objectId' },
			event: { bsonType: 'string' },
			source: { bsonType: 'string' },
			metadata: { bsonType: 'object' },
			dedupeKey: { bsonType: 'string' },
			occurredAt: { bsonType: 'date' },
		},
		['actorId', 'event'],
	),
	indexes: [
		{ key: { actorId: 1, createdAt: -1 }, name: 'interaction_actor_timeline_idx' },
		{ key: { event: 1, createdAt: -1 }, name: 'interaction_event_idx' },
		{ key: { dedupeKey: 1 }, name: 'interaction_dedupe_unique', unique: true, partialFilterExpression: { dedupeKey: { $exists: true } } },
		{ key: { createdAt: 1 }, name: 'interaction_retention_ttl', expireAfterSeconds: 60 * 60 * 24 * 90 },
	],
}

const matchStateSchema = z.enum(['pending', 'open', 'snoozed', 'archived'])

const matchInsightSchema = z.object({
	sharedValues: z.array(z.string()).default([]),
	conciergePrompt: z.string().optional(),
	nextBestAction: z.string().optional(),
	guardianNotes: z.string().optional(),
})

const matchSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	pairHash: z.string().min(16),
	memberIds: z.array(objectIdSchema).length(2),
	initiatedBy: objectIdSchema,
	state: matchStateSchema.default('pending'),
	score: z.number().min(0).max(1),
	scoreBreakdown: z.record(z.string(), z.number()).default({}),
	aiOpener: z.string().optional(),
	trustBadges: z.array(z.string()).default([]),
	lastInteractionAt: z.date().optional(),
	confirmedAt: z.date().optional(),
	insights: matchInsightSchema.optional(),
	metadata: z.record(z.string(), z.any()).optional(),
})

const matchesDefinition: CollectionDefinition<typeof matchSchema> = {
	name: 'matches',
	schema: matchSchema,
	validator: buildJsonSchema(
		{
			pairHash: { bsonType: 'string' },
			memberIds: { bsonType: 'array' },
			initiatedBy: { bsonType: 'objectId' },
			state: { bsonType: 'string' },
			score: { bsonType: 'double' },
			scoreBreakdown: { bsonType: 'object' },
			aiOpener: { bsonType: 'string' },
			trustBadges: { bsonType: 'array' },
			lastInteractionAt: { bsonType: 'date' },
			confirmedAt: { bsonType: 'date' },
			insights: { bsonType: 'object' },
			metadata: { bsonType: 'object' },
		},
		['pairHash', 'memberIds', 'initiatedBy', 'score'],
	),
	indexes: [
		{ key: { pairHash: 1 }, name: 'match_pair_unique', unique: true },
		{ key: { memberIds: 1, state: 1 }, name: 'match_member_state_idx' },
		{ key: { updatedAt: -1 }, name: 'match_recent_idx' },
	],
}

const interactionContextSchema = z.object({ source: z.string().default('discovery'), device: z.string().optional(), location: z.string().optional() })

const likeSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	actorId: objectIdSchema,
	targetId: objectIdSchema,
	type: z.literal('like'),
	context: interactionContextSchema.optional(),
})

const superLikeSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	actorId: objectIdSchema,
	targetId: objectIdSchema,
	boostScore: z.number().min(1).max(5).default(1),
	context: interactionContextSchema.optional(),
})

const boostSessionStatusSchema = z.enum(['pending', 'active', 'cleared', 'expired', 'refunded'])

const boostSessionSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	userId: objectIdSchema,
	placement: z.enum(['spotlight', 'travel', 'event']),
	locale: z.string().min(2).max(8).default('en'),
	startedAt: z.date(),
	endsAt: z.date(),
	budgetCredits: z.number().int().nonnegative(),
	bidAmountCredits: z.number().int().nonnegative().optional(),
	auctionWindowStart: z.date().optional(),
	status: boostSessionStatusSchema.default('pending'),
	source: z.enum(['direct', 'auction', 'referral']).default('direct'),
	metadata: z.record(z.string(), z.any()).optional(),
})

const rewindSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	userId: objectIdSchema,
	targetId: objectIdSchema,
	reason: z.enum(['accidental', 'premium-perk', 'safety']).default('accidental'),
	expiresAt: z.date(),
})

const likesDefinition: CollectionDefinition<typeof likeSchema> = {
	name: 'likes',
	schema: likeSchema,
	validator: buildJsonSchema(
		{
			actorId: { bsonType: 'objectId' },
			targetId: { bsonType: 'objectId' },
			type: { bsonType: 'string' },
			context: { bsonType: 'object' },
		},
		['actorId', 'targetId', 'type'],
	),
	indexes: [
		{ key: { actorId: 1, targetId: 1 }, unique: true, name: 'like_actor_target_unique' },
		{ key: { targetId: 1, createdAt: -1 }, name: 'like_target_feed_idx' },
		{ key: { createdAt: 1 }, name: 'like_retention_ttl', expireAfterSeconds: 60 * 60 * 24 * 90 },
	],
}

const superLikesDefinition: CollectionDefinition<typeof superLikeSchema> = {
	name: 'super_likes',
	schema: superLikeSchema,
	validator: buildJsonSchema(
		{
			actorId: { bsonType: 'objectId' },
			targetId: { bsonType: 'objectId' },
			boostScore: { bsonType: 'double' },
			context: { bsonType: 'object' },
		},
		['actorId', 'targetId'],
	),
	indexes: [
		{ key: { actorId: 1, createdAt: -1 }, name: 'super_like_actor_idx' },
		{ key: { targetId: 1 }, name: 'super_like_target_idx' },
	],
}

const boostSessionsDefinition: CollectionDefinition<typeof boostSessionSchema> = {
	name: 'boost_sessions',
	schema: boostSessionSchema,
	validator: buildJsonSchema(
		{
			userId: { bsonType: 'objectId' },
			placement: { bsonType: 'string' },
			locale: { bsonType: 'string' },
			startedAt: { bsonType: 'date' },
			endsAt: { bsonType: 'date' },
			budgetCredits: { bsonType: 'int' },
			bidAmountCredits: { bsonType: 'int' },
			auctionWindowStart: { bsonType: 'date' },
			status: { bsonType: 'string' },
			source: { bsonType: 'string' },
			metadata: { bsonType: 'object' },
		},
		['userId', 'placement', 'startedAt', 'endsAt'],
	),
	indexes: [
		{ key: { userId: 1, startedAt: -1 }, name: 'boost_user_idx' },
		{ key: { endsAt: 1 }, name: 'boost_expiry_ttl', expireAfterSeconds: 0 },
		{ key: { locale: 1, auctionWindowStart: -1, bidAmountCredits: -1 }, name: 'boost_auction_window_idx', partialFilterExpression: { auctionWindowStart: { $exists: true } } },
	],
}

const rewindsDefinition: CollectionDefinition<typeof rewindSchema> = {
	name: 'rewinds',
	schema: rewindSchema,
	validator: buildJsonSchema(
		{
			userId: { bsonType: 'objectId' },
			targetId: { bsonType: 'objectId' },
			reason: { bsonType: 'string' },
			expiresAt: { bsonType: 'date' },
		},
		['userId', 'targetId', 'reason', 'expiresAt'],
	),
	indexes: [
		{ key: { userId: 1, targetId: 1 }, name: 'rewind_actor_target_idx', unique: true },
		{ key: { expiresAt: 1 }, name: 'rewind_expiry_ttl', expireAfterSeconds: 0 },
	],
}

const notificationSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	userId: objectIdSchema,
	category: z.enum(['growth', 'match', 'event', 'safety', 'billing']).default('growth'),
	type: z.string(),
	channel: z.enum(['push', 'email', 'sms', 'in_app']).default('in_app'),
	templateId: z.string(),
	payload: z.record(z.string(), z.any()).default({}),
	status: z.enum(['pending', 'scheduled', 'sent', 'failed']).default('pending'),
	priority: z.enum(['low', 'normal', 'high']).default('normal'),
	scheduledAt: z.date().optional(),
	sentAt: z.date().optional(),
	readAt: z.date().optional(),
	seenAt: z.date().optional(),
	dedupeKey: z.string().optional(),
	metadata: z.record(z.string(), z.any()).optional(),
	deliveryResponse: z.record(z.string(), z.any()).optional(),
})

const notificationsDefinition: CollectionDefinition<typeof notificationSchema> = {
	name: 'notifications',
	schema: notificationSchema,
	validator: buildJsonSchema(
		{
			userId: { bsonType: 'objectId' },
			category: { bsonType: 'string' },
			type: { bsonType: 'string' },
			channel: { bsonType: 'string' },
			templateId: { bsonType: 'string' },
			payload: { bsonType: 'object' },
			status: { bsonType: 'string' },
			priority: { bsonType: 'string' },
			scheduledAt: { bsonType: 'date' },
			sentAt: { bsonType: 'date' },
			readAt: { bsonType: 'date' },
			seenAt: { bsonType: 'date' },
			dedupeKey: { bsonType: 'string' },
			metadata: { bsonType: 'object' },
			deliveryResponse: { bsonType: 'object' },
		},
		['userId', 'type', 'channel', 'templateId', 'status'],
	),
	indexes: [
		{ key: { userId: 1, createdAt: -1 }, name: 'notification_user_feed_idx' },
		{ key: { status: 1, scheduledAt: 1 }, name: 'notification_status_schedule_idx' },
		{ key: { dedupeKey: 1 }, name: 'notification_dedupe_unique', unique: true, partialFilterExpression: { dedupeKey: { $exists: true } } },
	],
}

const eventLocationSchema = z.object({
	type: z.enum(['virtual', 'in_person']).default('in_person'),
	city: z.string().optional(),
	country: z.string().optional(),
	lat: z.number().optional(),
	lng: z.number().optional(),
	venue: z.string().optional(),
	meetingUrl: z.string().url().optional(),
})

const ticketingSchema = z.object({
	priceCents: z.number().int().nonnegative().default(0),
	currency: z.string().length(3).default('USD'),
	provider: z.enum(['stripe', 'paystack', 'none']).default('none'),
	productId: z.string().optional(),
})

const eventSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	slug: z.string().min(3),
	title: z.string().min(3),
	description: z.string().max(4000),
	hostUserIds: z.array(objectIdSchema).min(1),
	visibility: z.enum(['public', 'tribe', 'invite']).default('public'),
	tribe: z.string().optional(),
	tags: z.array(z.string()).default([]),
	startAt: z.date(),
	endAt: z.date(),
	timezone: z.string().optional(),
	capacity: z.number().int().positive(),
	waitlistEnabled: z.boolean().default(true),
	location: eventLocationSchema,
	ticketing: ticketingSchema.default({ priceCents: 0, currency: 'USD', provider: 'none' }),
	assets: z.array(z.object({ url: z.string().url(), type: z.enum(['cover', 'gallery']), caption: z.string().optional() })).default([]),
	moderationState: z.enum(['draft', 'published', 'flagged', 'archived']).default('draft'),
})

const eventsDefinition: CollectionDefinition<typeof eventSchema> = {
	name: 'events',
	schema: eventSchema,
	validator: buildJsonSchema(
		{
			slug: { bsonType: 'string' },
			title: { bsonType: 'string' },
			description: { bsonType: 'string' },
			hostUserIds: { bsonType: 'array' },
			visibility: { bsonType: 'string' },
			tribe: { bsonType: 'string' },
			tags: { bsonType: 'array' },
			startAt: { bsonType: 'date' },
			endAt: { bsonType: 'date' },
			timezone: { bsonType: 'string' },
			capacity: { bsonType: 'int' },
			waitlistEnabled: { bsonType: 'bool' },
			location: { bsonType: 'object' },
			ticketing: { bsonType: 'object' },
			assets: { bsonType: 'array' },
			moderationState: { bsonType: 'string' },
		},
		['slug', 'title', 'hostUserIds', 'startAt', 'endAt', 'capacity', 'location'],
	),
	indexes: [
		{ key: { slug: 1 }, name: 'event_slug_unique', unique: true },
		{ key: { startAt: 1 }, name: 'event_start_idx' },
		{ key: { 'location.country': 1, startAt: 1 }, name: 'event_country_schedule_idx' },
		{ key: { visibility: 1, startAt: -1 }, name: 'event_visibility_idx' },
	],
}

const registrationStatusSchema = z.enum(['pending', 'confirmed', 'waitlisted', 'cancelled'])
const paymentStatusSchema = z.enum(['none', 'requires_payment', 'paid', 'refunded'])

const eventRegistrationSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	eventId: objectIdSchema,
	userId: objectIdSchema,
	status: registrationStatusSchema.default('pending'),
	paymentStatus: paymentStatusSchema.default('none'),
	referralCode: z.string().optional(),
	source: z.enum(['organic', 'invite', 'sponsor']).default('organic'),
	checkIn: z.object({ at: z.date(), stewardId: objectIdSchema.optional() }).optional(),
	cancelledAt: z.date().optional(),
	notes: z.string().optional(),
})

const eventRegistrationsDefinition: CollectionDefinition<typeof eventRegistrationSchema> = {
	name: 'event_registrations',
	schema: eventRegistrationSchema,
	validator: buildJsonSchema(
		{
			eventId: { bsonType: 'objectId' },
			userId: { bsonType: 'objectId' },
			status: { bsonType: 'string' },
			paymentStatus: { bsonType: 'string' },
			referralCode: { bsonType: 'string' },
			source: { bsonType: 'string' },
			checkIn: { bsonType: 'object' },
			cancelledAt: { bsonType: 'date' },
			notes: { bsonType: 'string' },
		},
		['eventId', 'userId', 'status', 'paymentStatus'],
	),
	indexes: [
		{ key: { eventId: 1, userId: 1 }, name: 'registration_event_user_unique', unique: true },
		{ key: { eventId: 1, status: 1 }, name: 'registration_event_status_idx' },
		{ key: { userId: 1, status: 1 }, name: 'registration_user_status_idx' },
		{ key: { referralCode: 1 }, name: 'registration_referral_idx', partialFilterExpression: { referralCode: { $exists: true } } },
	],
}

const postMediaSchema = z.object({
	url: z.string().url(),
	type: z.enum(['image', 'video', 'audio', 'file']).default('image'),
	width: z.number().int().positive().optional(),
	height: z.number().int().positive().optional(),
	durationMs: z.number().int().positive().optional(),
	blurhash: z.string().optional(),
})

const amaScheduleItemSchema = z.object({
	topic: z.string(),
	startAt: z.date(),
	hostId: objectIdSchema.optional(),
	description: z.string().optional(),
	meetingUrl: z.string().url().optional(),
})

const communityClubSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	slug: z.string().min(2),
	name: z.string().min(3),
	tagline: z.string().max(160).optional(),
	description: z.string().max(4000),
	tags: z.array(z.string()).default([]),
	coverImage: z.string().url().optional(),
	accentColor: z.string().optional(),
	visibility: z.enum(['public', 'invite', 'guardian']).default('public'),
	guardianOnly: z.boolean().default(false),
	memberCount: z.number().int().nonnegative().default(0),
	featuredHostIds: z.array(objectIdSchema).default([]),
	timezone: z.string().optional(),
	amaSchedule: z.array(amaScheduleItemSchema).default([]),
	metadata: z.record(z.string(), z.any()).optional(),
	status: z.enum(['active', 'archived']).default('active'),
	pinnedPostIds: z.array(objectIdSchema).default([]),
})

const communityClubsDefinition: CollectionDefinition<typeof communityClubSchema> = {
	name: 'community_clubs',
	schema: communityClubSchema,
	validator: buildJsonSchema(
		{
			slug: { bsonType: 'string' },
			name: { bsonType: 'string' },
			tagline: { bsonType: 'string' },
			description: { bsonType: 'string' },
			tags: { bsonType: 'array' },
			coverImage: { bsonType: 'string' },
			accentColor: { bsonType: 'string' },
			visibility: { bsonType: 'string' },
			guardianOnly: { bsonType: 'bool' },
			memberCount: { bsonType: 'int' },
			featuredHostIds: { bsonType: 'array' },
			timezone: { bsonType: 'string' },
			amaSchedule: { bsonType: 'array' },
			metadata: { bsonType: 'object' },
			status: { bsonType: 'string' },
			pinnedPostIds: { bsonType: 'array' },
		},
		['slug', 'name', 'description'],
	),
	indexes: [
		{ key: { slug: 1 }, name: 'community_club_slug_unique', unique: true },
		{ key: { status: 1, memberCount: -1 }, name: 'community_club_status_members_idx' },
		{ key: { visibility: 1 }, name: 'community_club_visibility_idx' },
	],
}

const pollSchema = z.object({
	question: z.string(),
	options: z.array(z.object({ optionId: z.string(), label: z.string(), votes: z.number().int().nonnegative().default(0) })).min(2),
	expiresAt: z.date().optional(),
	multiSelect: z.boolean().default(false),
})

const reactionCounterSchema = z.object({
	type: z.string(),
	count: z.number().int().nonnegative().default(0),
})

const safetyStateSchema = z.object({
	state: z.enum(['clear', 'flagged', 'blocked']).default('clear'),
	reason: z.string().optional(),
	toxicityScore: z.number().min(0).max(1).optional(),
	lastReviewedAt: z.date().optional(),
})

const communityPostSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	authorId: objectIdSchema,
	clubId: objectIdSchema.optional(),
	visibility: z.enum(['public', 'tribe', 'club', 'private']).default('public'),
	body: z.string().max(5000).optional(),
	richText: z.record(z.string(), z.any()).optional(),
	mentions: z.array(objectIdSchema).default([]),
	media: z.array(postMediaSchema).default([]),
	poll: pollSchema.optional(),
	reactionCounts: z.array(reactionCounterSchema).default([]),
	commentCount: z.number().int().nonnegative().default(0),
	shareCount: z.number().int().nonnegative().default(0),
	safety: safetyStateSchema.default({ state: 'clear' }),
	pin: z.object({ isPinned: z.boolean(), expiresAt: z.date().optional() }).optional(),
	tags: z.array(z.string()).default([]),
	metadata: z.record(z.string(), z.any()).optional(),
})

const communityPostsDefinition: CollectionDefinition<typeof communityPostSchema> = {
	name: 'community_posts',
	schema: communityPostSchema,
	validator: buildJsonSchema(
		{
			authorId: { bsonType: 'objectId' },
			clubId: { bsonType: 'objectId' },
			visibility: { bsonType: 'string' },
			body: { bsonType: 'string' },
			richText: { bsonType: 'object' },
			mentions: { bsonType: 'array' },
			media: { bsonType: 'array' },
			poll: { bsonType: 'object' },
			reactionCounts: { bsonType: 'array' },
			commentCount: { bsonType: 'int' },
			shareCount: { bsonType: 'int' },
			safety: { bsonType: 'object' },
			pin: { bsonType: 'object' },
			tags: { bsonType: 'array' },
			metadata: { bsonType: 'object' },
		},
		['authorId', 'visibility'],
	),
	indexes: [
		{ key: { clubId: 1, createdAt: -1 }, name: 'post_club_feed_idx', partialFilterExpression: { clubId: { $exists: true } } },
		{ key: { visibility: 1, createdAt: -1 }, name: 'post_visibility_feed_idx' },
		{ key: { authorId: 1, createdAt: -1 }, name: 'post_author_history_idx' },
		{ key: { 'safety.state': 1, createdAt: -1 }, name: 'post_safety_state_idx' },
		{ key: { body: 'text' }, name: 'post_body_text_idx' },
	],
}

const commentReactionSchema = z.object({
	userId: objectIdSchema,
	emoji: z.string(),
	reactedAt: z.date(),
})

const communityCommentSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	postId: objectIdSchema,
	authorId: objectIdSchema,
	body: z.string().max(3000).optional(),
	richText: z.record(z.string(), z.any()).optional(),
	attachments: z.array(postMediaSchema).default([]),
	parentCommentId: objectIdSchema.optional(),
	threadPath: z.string().min(1),
	reactions: z.array(commentReactionSchema).default([]),
	safety: safetyStateSchema.default({ state: 'clear' }),
	deletedAt: z.date().optional(),
})

const communityCommentsDefinition: CollectionDefinition<typeof communityCommentSchema> = {
	name: 'community_comments',
	schema: communityCommentSchema,
	validator: buildJsonSchema(
		{
			postId: { bsonType: 'objectId' },
			authorId: { bsonType: 'objectId' },
			body: { bsonType: 'string' },
			richText: { bsonType: 'object' },
			attachments: { bsonType: 'array' },
			parentCommentId: { bsonType: 'objectId' },
			threadPath: { bsonType: 'string' },
			reactions: { bsonType: 'array' },
			safety: { bsonType: 'object' },
			deletedAt: { bsonType: 'date' },
		},
		['postId', 'authorId', 'threadPath'],
	),
	indexes: [
		{ key: { postId: 1, threadPath: 1 }, name: 'comment_post_thread_idx' },
		{ key: { authorId: 1, createdAt: -1 }, name: 'comment_author_idx' },
		{ key: { parentCommentId: 1, createdAt: 1 }, name: 'comment_parent_idx', partialFilterExpression: { parentCommentId: { $exists: true } } },
		{ key: { 'safety.state': 1, createdAt: -1 }, name: 'comment_safety_state_idx' },
	],
}

const reportSubjectSchema = z.object({
	collection: z.string(),
	refId: objectIdSchema,
})

const evidenceSchema = z.object({
	type: z.enum(['screenshot', 'message', 'note', 'file']),
	url: z.string().url().optional(),
	text: z.string().optional(),
})

const reportSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	reporterId: objectIdSchema.optional(),
	subject: reportSubjectSchema,
	subjectType: z.enum(['user', 'post', 'comment', 'event', 'message', 'profile']).default('user'),
	involvesSafety: z.boolean().default(false),
	reason: z.string(),
	details: z.string().optional(),
	evidence: z.array(evidenceSchema).default([]),
	status: z.enum(['open', 'triaged', 'in_progress', 'resolved', 'dismissed']).default('open'),
	assignedTo: objectIdSchema.optional(),
	resolution: z.object({ outcome: z.string(), notes: z.string().optional(), resolvedAt: z.date().optional() }).optional(),
	riskScore: z.number().min(0).max(1).default(0.5),
})

const reportsDefinition: CollectionDefinition<typeof reportSchema> = {
	name: 'reports',
	schema: reportSchema,
	validator: buildJsonSchema(
		{
			reporterId: { bsonType: 'objectId' },
			subject: { bsonType: 'object' },
			subjectType: { bsonType: 'string' },
			reason: { bsonType: 'string' },
			details: { bsonType: 'string' },
			evidence: { bsonType: 'array' },
			status: { bsonType: 'string' },
			assignedTo: { bsonType: 'objectId' },
			resolution: { bsonType: 'object' },
			riskScore: { bsonType: 'double' },
		},
		['subject', 'subjectType', 'reason', 'status'],
	),
	indexes: [
		{ key: { 'subject.collection': 1, 'subject.refId': 1, createdAt: -1 }, name: 'report_subject_idx' },
		{ key: { status: 1, createdAt: -1 }, name: 'report_status_idx' },
		{ key: { assignedTo: 1, status: 1 }, name: 'report_assignment_idx', partialFilterExpression: { assignedTo: { $exists: true } } },
	],
}

const moderationActionSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	actorId: objectIdSchema.optional(),
	actorType: z.enum(['human', 'system', 'ai']).default('human'),
	subject: reportSubjectSchema,
	action: z.enum(['warn', 'mute', 'ban', 'content_remove', 'shadowban']).default('warn'),
	policyVersion: z.string().optional(),
	notes: z.string().optional(),
	attachments: z.array(evidenceSchema).default([]),
	automated: z.boolean().default(false),
	expiresAt: z.date().optional(),
	linkedReportId: objectIdSchema.optional(),
	metadata: z.record(z.string(), z.any()).optional(),
})

const moderationActionsDefinition: CollectionDefinition<typeof moderationActionSchema> = {
	name: 'moderation_actions',
	schema: moderationActionSchema,
	validator: buildJsonSchema(
		{
			actorId: { bsonType: 'objectId' },
			actorType: { bsonType: 'string' },
			subject: { bsonType: 'object' },
			action: { bsonType: 'string' },
			policyVersion: { bsonType: 'string' },
			notes: { bsonType: 'string' },
			attachments: { bsonType: 'array' },
			automated: { bsonType: 'bool' },
			expiresAt: { bsonType: 'date' },
			linkedReportId: { bsonType: 'objectId' },
			metadata: { bsonType: 'object' },
		},
		['subject', 'action'],
	),
	indexes: [
		{ key: { 'subject.collection': 1, 'subject.refId': 1, createdAt: -1 }, name: 'moderation_subject_idx' },
		{ key: { actorId: 1, createdAt: -1 }, name: 'moderation_actor_idx', partialFilterExpression: { actorId: { $exists: true } } },
		{ key: { expiresAt: 1 }, name: 'moderation_expiry_ttl', expireAfterSeconds: 0 },
		{ key: { linkedReportId: 1 }, name: 'moderation_linked_report_idx', partialFilterExpression: { linkedReportId: { $exists: true } } },
	],
}

const trustEventSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	userId: objectIdSchema,
	eventType: z.string(),
	source: z.enum(['ai', 'manual', 'system']).default('system'),
	scoreDelta: z.number().min(-1).max(1),
	aggregateScore: z.number().min(0).max(1),
	context: z.record(z.string(), z.any()).optional(),
	relatedIds: z.array(objectIdSchema).default([]),
	expiresAt: z.date().optional(),
})

const trustEventsDefinition: CollectionDefinition<typeof trustEventSchema> = {
	name: 'trust_events',
	schema: trustEventSchema,
	validator: buildJsonSchema(
		{
			userId: { bsonType: 'objectId' },
			eventType: { bsonType: 'string' },
			source: { bsonType: 'string' },
			scoreDelta: { bsonType: 'double' },
			aggregateScore: { bsonType: 'double' },
			context: { bsonType: 'object' },
			relatedIds: { bsonType: 'array' },
			expiresAt: { bsonType: 'date' },
		},
		['userId', 'eventType', 'scoreDelta', 'aggregateScore'],
	),
	indexes: [
		{ key: { userId: 1, createdAt: -1 }, name: 'trust_user_timeline_idx' },
		{ key: { eventType: 1, createdAt: -1 }, name: 'trust_event_type_idx' },
		{ key: { expiresAt: 1 }, name: 'trust_event_expiry_ttl', expireAfterSeconds: 0 },
	],
}

const livenessProviderDecisionSchema = z.object({
	provider: z.string().default('pending'),
	providerSessionId: z.string().optional(),
	decision: z.enum(['pending', 'pass', 'fail', 'fallback']).default('pending'),
	confidence: z.number().min(0).max(1).optional(),
	reasons: z.array(z.string()).optional(),
	decidedAt: z.date().optional(),
})

const livenessArtifactsSchema = z.object({
	photoKey: z.string().optional(),
	videoKey: z.string().optional(),
	idFrontKey: z.string().optional(),
	idBackKey: z.string().optional(),
})

const livenessMetricsSchema = z.object({
	brightness: z.number().optional(),
	faceMatches: z.number().optional(),
	numAttempts: z.number().int().nonnegative().optional(),
	deviceMotionScore: z.number().optional(),
})

const livenessSessionSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	sessionToken: z.string().min(16).max(64),
	memberId: objectIdSchema,
	intent: z.enum(['onboarding', 'guardian_invite']).default('onboarding'),
	device: z.enum(['web', 'ios', 'android']).default('web'),
	locale: z.string().min(2).max(5),
	status: z.enum(['created', 'awaiting_upload', 'awaiting_provider', 'passed', 'failed', 'manual_review']).default('created'),
	expiresAt: z.date().optional(),
	uploadUrls: z
		.object({
			photo: z.string().url().optional(),
			video: z.string().url().optional(),
			idFront: z.string().url().optional(),
			idBack: z.string().url().optional(),
		})
		.optional(),
	artifacts: livenessArtifactsSchema.optional(),
	metrics: livenessMetricsSchema.optional(),
	provider: livenessProviderDecisionSchema.default({ provider: 'pending', decision: 'pending' }),
	retryCount: z.number().int().nonnegative().default(0),
	webhookAttempts: z.number().int().nonnegative().default(0),
	flags: z.array(z.string()).default([]),
	notes: z.array(z.object({ message: z.string(), authorId: objectIdSchema.optional(), createdAt: z.date() })).default([]),
})

const livenessSessionsDefinition: CollectionDefinition<typeof livenessSessionSchema> = {
	name: 'liveness_sessions',
	schema: livenessSessionSchema,
	validator: buildJsonSchema(
		{
			sessionToken: { bsonType: 'string' },
			memberId: { bsonType: 'objectId' },
			intent: { bsonType: 'string' },
			device: { bsonType: 'string' },
			locale: { bsonType: 'string' },
			status: { bsonType: 'string' },
			expiresAt: { bsonType: 'date' },
			uploadUrls: { bsonType: 'object' },
			artifacts: { bsonType: 'object' },
			metrics: { bsonType: 'object' },
			provider: { bsonType: 'object' },
			retryCount: { bsonType: 'int' },
			webhookAttempts: { bsonType: 'int' },
			flags: { bsonType: 'array' },
			notes: { bsonType: 'array' },
		},
		['sessionToken', 'memberId', 'intent', 'device', 'locale', 'status'],
	),
	indexes: [
		{ key: { sessionToken: 1 }, name: 'liveness_session_token_unique', unique: true },
		{ key: { memberId: 1, createdAt: -1 }, name: 'liveness_member_history_idx' },
		{ key: { status: 1, createdAt: -1 }, name: 'liveness_status_idx' },
		{ key: { expiresAt: 1 }, name: 'liveness_session_expiry_idx', expireAfterSeconds: 0 },
	],
}

const guardianInviteRequestSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	memberName: z.string().min(2).max(140),
	contact: z.string().min(5).max(160),
	locale: z.string().min(2).max(5),
	context: z.string().max(1000).optional(),
	regionHint: z.string().max(64).optional(),
	source: z.enum(['family_portal_form', 'admin', 'api']).default('family_portal_form'),
	status: z.enum(['received', 'queued', 'notified', 'dismissed']).default('received'),
	metadata: z
		.object({
			ip: z.string().optional(),
			userAgent: z.string().optional(),
			tags: z.array(z.string()).optional(),
		})
		.optional(),
})

const guardianInviteRequestsDefinition: CollectionDefinition<typeof guardianInviteRequestSchema> = {
	name: 'guardian_invite_requests',
	schema: guardianInviteRequestSchema,
	validator: buildJsonSchema(
		{
			memberName: { bsonType: 'string' },
			contact: { bsonType: 'string' },
			locale: { bsonType: 'string' },
			context: { bsonType: 'string' },
			regionHint: { bsonType: 'string' },
			source: { bsonType: 'string' },
			status: { bsonType: 'string' },
			metadata: { bsonType: 'object' },
		},
		['memberName', 'contact', 'locale', 'status', 'source'],
	),
	indexes: [
		{ key: { status: 1, createdAt: -1 }, name: 'guardian_invite_status_idx' },
		{ key: { locale: 1, createdAt: -1 }, name: 'guardian_invite_locale_idx' },
		{
			key: { contact: 1, createdAt: -1 },
			name: 'guardian_invite_contact_idx',
		},
	],
}

const moneySchema = z.object({
	amountCents: z.number().int().nonnegative(),
	currency: z.string().length(3),
})

const providerRefSchema = z.object({
	provider: z.enum(['stripe', 'paystack', 'apple', 'google', 'manual']).default('stripe'),
	externalId: z.string(),
})

const subscriptionStatusSchema = z.enum(['trialing', 'active', 'past_due', 'cancelled', 'incomplete', 'paused'])

const cancellationSchema = z.object({
	requestedAt: z.date(),
	effectiveAt: z.date(),
	reason: z.string().optional(),
})

const entitlementSnapshotSchema = z.object({
	featureKey: z.string(),
	limit: z.number().int().nonnegative(),
	grantedAt: z.date(),
})

const subscriptionSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	userId: objectIdSchema,
	planId: z.string(),
	status: subscriptionStatusSchema.default('trialing'),
	providerCustomerId: z.string(),
	providerSubscriptionId: z.string(),
	billingProvider: providerRefSchema.shape.provider,
	startAt: z.date(),
	currentPeriodStart: z.date(),
	currentPeriodEnd: z.date(),
	autoRenew: z.boolean().default(true),
	trialEndsAt: z.date().optional(),
	cancellation: cancellationSchema.optional(),
	entitlements: z.array(entitlementSnapshotSchema).default([]),
	billingAnchorDay: z.number().int().min(1).max(31).optional(),
	metadata: z.record(z.string(), z.any()).optional(),
})

const subscriptionsDefinition: CollectionDefinition<typeof subscriptionSchema> = {
	name: 'subscriptions',
	schema: subscriptionSchema,
	validator: buildJsonSchema(
		{
			userId: { bsonType: 'objectId' },
			planId: { bsonType: 'string' },
			status: { bsonType: 'string' },
			providerCustomerId: { bsonType: 'string' },
			providerSubscriptionId: { bsonType: 'string' },
			billingProvider: { bsonType: 'string' },
			startAt: { bsonType: 'date' },
			currentPeriodStart: { bsonType: 'date' },
			currentPeriodEnd: { bsonType: 'date' },
			autoRenew: { bsonType: 'bool' },
			trialEndsAt: { bsonType: 'date' },
			cancellation: { bsonType: 'object' },
			entitlements: { bsonType: 'array' },
			billingAnchorDay: { bsonType: 'int' },
			metadata: { bsonType: 'object' },
		},
		['userId', 'planId', 'status', 'providerCustomerId', 'providerSubscriptionId', 'startAt', 'currentPeriodStart', 'currentPeriodEnd'],
	),
	indexes: [
		{ key: { userId: 1, status: 1 }, name: 'subscription_user_status_idx' },
		{ key: { billingProvider: 1, providerSubscriptionId: 1 }, name: 'subscription_provider_unique', unique: true },
		{ key: { planId: 1, status: 1 }, name: 'subscription_plan_status_idx' },
	],
}

const paymentProcessingStatusSchema = z.enum(['requires_action', 'processing', 'succeeded', 'refunded', 'failed'])

const paymentLineItemSchema = z.object({
	itemType: z.string(),
	description: z.string().optional(),
	quantity: z.number().int().positive().default(1),
	amount: moneySchema,
})

const paymentSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	userId: objectIdSchema,
	source: z.enum(['web', 'mobile', 'event', 'admin']).default('web'),
	providerPaymentId: z.string(),
	billingProvider: providerRefSchema.shape.provider,
	amount: moneySchema,
	feeAmount: moneySchema.optional(),
	status: paymentProcessingStatusSchema.default('processing'),
	lineItems: z.array(paymentLineItemSchema).default([]),
	metadata: z.record(z.string(), z.any()).optional(),
	latestWebhook: z.object({ type: z.string(), receivedAt: z.date(), payloadId: z.string().optional() }).optional(),
	refundedAt: z.date().optional(),
	refundReason: z.string().optional(),
})

const paymentsDefinition: CollectionDefinition<typeof paymentSchema> = {
	name: 'payments',
	schema: paymentSchema,
	validator: buildJsonSchema(
		{
			userId: { bsonType: 'objectId' },
			source: { bsonType: 'string' },
			providerPaymentId: { bsonType: 'string' },
			billingProvider: { bsonType: 'string' },
			amount: { bsonType: 'object' },
			feeAmount: { bsonType: 'object' },
			status: { bsonType: 'string' },
			lineItems: { bsonType: 'array' },
			metadata: { bsonType: 'object' },
			latestWebhook: { bsonType: 'object' },
			refundedAt: { bsonType: 'date' },
			refundReason: { bsonType: 'string' },
		},
		['userId', 'providerPaymentId', 'billingProvider', 'amount', 'status'],
	),
	indexes: [
		{ key: { billingProvider: 1, providerPaymentId: 1 }, name: 'payment_provider_unique', unique: true },
		{ key: { userId: 1, createdAt: -1 }, name: 'payment_user_history_idx' },
		{ key: { status: 1, createdAt: -1 }, name: 'payment_status_idx' },
	],
}

const walletProviderConfigSchema = z.object({
	enabled: z.boolean().default(false),
	merchantId: z.string().max(128).optional(),
	merchantName: z.string().max(128).optional(),
	merchantCapabilities: z.array(z.string()).default([]),
	supportedNetworks: z.array(z.string()).default([]),
	countryCode: z.string().length(2).optional(),
	currencyCode: z.string().length(3).optional(),
	gateway: z.string().optional(),
	environment: z.enum(['test', 'production']).default('test'),
	minOSVersion: z.string().optional(),
})

const walletConfigSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	region: z.string().min(2).max(32),
	currency: z.string().length(3).default('USD'),
	countryCode: z.string().length(2).default('US'),
	fallbackProvider: z.enum(['stripe', 'paystack']).default('stripe'),
	applePay: walletProviderConfigSchema.default({ enabled: false }),
	googlePay: walletProviderConfigSchema.default({ enabled: false }),
	notes: z.string().max(500).optional(),
})

const walletConfigsDefinition: CollectionDefinition<typeof walletConfigSchema> = {
	name: 'wallet_configs',
	schema: walletConfigSchema,
	validator: buildJsonSchema(
		{
			region: { bsonType: 'string' },
			currency: { bsonType: 'string' },
			countryCode: { bsonType: 'string' },
			fallbackProvider: { bsonType: 'string' },
			applePay: { bsonType: 'object' },
			googlePay: { bsonType: 'object' },
			notes: { bsonType: 'string' },
		},
		['region'],
	),
	indexes: [
		{ key: { region: 1 }, name: 'wallet_region_unique', unique: true },
	],
}

const invoiceStatusSchema = z.enum(['draft', 'open', 'paid', 'void', 'uncollectible'])

const invoiceLineItemSchema = z.object({
	description: z.string(),
	amount: moneySchema,
	quantity: z.number().int().positive().default(1),
	metadata: z.record(z.string(), z.any()).optional(),
})

const invoiceSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	userId: objectIdSchema,
	subscriptionId: objectIdSchema.optional(),
	periodStart: z.date(),
	periodEnd: z.date(),
	amountDue: moneySchema,
	amountPaid: moneySchema.optional(),
	taxAmount: moneySchema.optional(),
	status: invoiceStatusSchema.default('draft'),
	dueDate: z.date().optional(),
	providerInvoiceId: z.string().optional(),
	billingProvider: providerRefSchema.shape.provider,
	lineItems: z.array(invoiceLineItemSchema).default([]),
	pdfUrl: z.string().url().optional(),
	dunningState: z.enum(['none', 'email_1', 'email_2', 'final']).default('none'),
})

const invoicesDefinition: CollectionDefinition<typeof invoiceSchema> = {
	name: 'invoices',
	schema: invoiceSchema,
	validator: buildJsonSchema(
		{
			userId: { bsonType: 'objectId' },
			subscriptionId: { bsonType: 'objectId' },
			periodStart: { bsonType: 'date' },
			periodEnd: { bsonType: 'date' },
			amountDue: { bsonType: 'object' },
			amountPaid: { bsonType: 'object' },
			taxAmount: { bsonType: 'object' },
			status: { bsonType: 'string' },
			dueDate: { bsonType: 'date' },
			providerInvoiceId: { bsonType: 'string' },
			billingProvider: { bsonType: 'string' },
			lineItems: { bsonType: 'array' },
			pdfUrl: { bsonType: 'string' },
			dunningState: { bsonType: 'string' },
		},
		['userId', 'periodStart', 'periodEnd', 'amountDue', 'status', 'billingProvider'],
	),
	indexes: [
		{ key: { billingProvider: 1, providerInvoiceId: 1 }, name: 'invoice_provider_unique', unique: true, partialFilterExpression: { providerInvoiceId: { $exists: true } } },
		{ key: { subscriptionId: 1, periodStart: 1 }, name: 'invoice_subscription_period_unique', unique: true, partialFilterExpression: { subscriptionId: { $exists: true } } },
		{ key: { status: 1, dueDate: 1 }, name: 'invoice_status_due_idx' },
	],
}

const entitlementSourceSchema = z.enum(['subscription', 'promotion', 'admin', 'event', 'referral', 'auction'])

const entitlementSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	userId: objectIdSchema,
	source: entitlementSourceSchema.default('subscription'),
	featureKey: z.string(),
	quantity: z.number().int().nonnegative().default(0),
	remaining: z.number().int().nonnegative().default(0),
	renewalSchedule: z.enum(['monthly', 'quarterly', 'annual', 'one_time']).default('monthly'),
	expiresAt: z.date().optional(),
	metadata: z.record(z.string(), z.any()).optional(),
	audit: z.array(z.object({ at: z.date(), delta: z.number().int(), reason: z.string().optional() })).default([]),
})

const entitlementsDefinition: CollectionDefinition<typeof entitlementSchema> = {
	name: 'entitlements',
	schema: entitlementSchema,
	validator: buildJsonSchema(
		{
			userId: { bsonType: 'objectId' },
			source: { bsonType: 'string' },
			featureKey: { bsonType: 'string' },
			quantity: { bsonType: 'int' },
			remaining: { bsonType: 'int' },
			renewalSchedule: { bsonType: 'string' },
			expiresAt: { bsonType: 'date' },
			metadata: { bsonType: 'object' },
			audit: { bsonType: 'array' },
		},
		['userId', 'source', 'featureKey'],
	),
	indexes: [
		{ key: { userId: 1, featureKey: 1, source: 1 }, name: 'entitlement_user_feature_unique', unique: true },
		{ key: { expiresAt: 1 }, name: 'entitlement_expiry_ttl', expireAfterSeconds: 0 },
	],
}

const analyticsSnapshotSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	type: z.enum(['activation', 'retention', 'revenue', 'trust']).default('activation'),
	range: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
	windowStart: z.date(),
	windowEnd: z.date(),
	dimensions: z.object({
		locale: z.string().optional(),
		tribe: z.string().optional(),
		planId: z.string().optional(),
		platform: z.enum(['web', 'ios', 'android']).optional(),
	}).default({}),
	metrics: z.record(z.string(), z.number()).default({}),
	source: z.enum(['segment', 'warehouse', 'ml']).default('segment'),
	generatedAt: z.date(),
	notes: z.string().optional(),
})

const analyticsSnapshotsDefinition: CollectionDefinition<typeof analyticsSnapshotSchema> = {
	name: 'analytics_snapshots',
	schema: analyticsSnapshotSchema,
	validator: buildJsonSchema(
		{
			type: { bsonType: 'string' },
			range: { bsonType: 'string' },
			windowStart: { bsonType: 'date' },
			windowEnd: { bsonType: 'date' },
			dimensions: { bsonType: 'object' },
			metrics: { bsonType: 'object' },
			source: { bsonType: 'string' },
			generatedAt: { bsonType: 'date' },
			notes: { bsonType: 'string' },
		},
		['type', 'range', 'windowStart', 'windowEnd', 'metrics', 'generatedAt'],
	),
	indexes: [
		{ key: { type: 1, range: 1, windowStart: 1 }, name: 'analytics_type_range_window_unique', unique: true },
		{ key: { 'dimensions.locale': 1, windowStart: -1 }, name: 'analytics_locale_window_idx', partialFilterExpression: { 'dimensions.locale': { $exists: true } } },
		{ key: { generatedAt: -1 }, name: 'analytics_generated_idx' },
	],
}

const funnelMetricSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	funnelId: z.string(),
	stepOrder: z.number().int().nonnegative(),
	stepName: z.string(),
	audienceFilters: z.record(z.string(), z.any()).default({}),
	counts: z.object({
		entered: z.number().int().nonnegative().default(0),
		completed: z.number().int().nonnegative().default(0),
		dropOff: z.number().int().nonnegative().default(0),
	}).default({ entered: 0, completed: 0, dropOff: 0 }),
	conversionRate: z.number().min(0).max(1).default(0),
	windowStart: z.date(),
	windowEnd: z.date(),
	experimentKey: z.string().optional(),
})

const funnelMetricsDefinition: CollectionDefinition<typeof funnelMetricSchema> = {
	name: 'funnel_metrics',
	schema: funnelMetricSchema,
	validator: buildJsonSchema(
		{
			funnelId: { bsonType: 'string' },
			stepOrder: { bsonType: 'int' },
			stepName: { bsonType: 'string' },
			audienceFilters: { bsonType: 'object' },
			counts: { bsonType: 'object' },
			conversionRate: { bsonType: 'double' },
			windowStart: { bsonType: 'date' },
			windowEnd: { bsonType: 'date' },
			experimentKey: { bsonType: 'string' },
		},
		['funnelId', 'stepOrder', 'windowStart', 'windowEnd'],
	),
	indexes: [
		{ key: { funnelId: 1, stepOrder: 1, windowStart: 1 }, name: 'funnel_step_window_unique', unique: true },
		{ key: { experimentKey: 1, windowStart: 1 }, name: 'funnel_experiment_idx', partialFilterExpression: { experimentKey: { $exists: true } } },
	],
}

const cohortMetricSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	cohortKey: z.string(),
	cohortDate: z.date(),
	dimension: z.string().default('global'),
	weekNumber: z.number().int().nonnegative(),
	retentionRate: z.number().min(0).max(1).default(0),
	revenuePerUser: z.number().nonnegative().default(0),
	notes: z.string().optional(),
})

const cohortMetricsDefinition: CollectionDefinition<typeof cohortMetricSchema> = {
	name: 'cohort_metrics',
	schema: cohortMetricSchema,
	validator: buildJsonSchema(
		{
			cohortKey: { bsonType: 'string' },
			cohortDate: { bsonType: 'date' },
			dimension: { bsonType: 'string' },
			weekNumber: { bsonType: 'int' },
			retentionRate: { bsonType: 'double' },
			revenuePerUser: { bsonType: 'double' },
			notes: { bsonType: 'string' },
		},
		['cohortKey', 'cohortDate', 'weekNumber'],
	),
	indexes: [
		{ key: { cohortKey: 1, weekNumber: 1 }, name: 'cohort_week_unique', unique: true },
		{ key: { dimension: 1, weekNumber: 1 }, name: 'cohort_dimension_week_idx' },
	],
}

const activityLogSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	actorId: objectIdSchema.optional(),
	actorType: z.enum(['user', 'admin', 'system']).default('system'),
	action: z.string(),
	resource: z.object({ collection: z.string(), id: objectIdSchema.optional() }),
	metadata: z.record(z.string(), z.any()).default({}),
	ip: z.string().optional(),
	userAgent: z.string().optional(),
	entryHash: z.string(),
	previousHash: z.string().optional(),
	archivedAt: z.date().optional(),
})

const activityLogsDefinition: CollectionDefinition<typeof activityLogSchema> = {
	name: 'activity_logs',
	schema: activityLogSchema,
	validator: buildJsonSchema(
		{
			actorId: { bsonType: 'objectId' },
			actorType: { bsonType: 'string' },
			action: { bsonType: 'string' },
			resource: { bsonType: 'object' },
			metadata: { bsonType: 'object' },
			ip: { bsonType: 'string' },
			userAgent: { bsonType: 'string' },
			entryHash: { bsonType: 'string' },
			previousHash: { bsonType: 'string' },
			archivedAt: { bsonType: 'date' },
		},
		['action', 'resource', 'entryHash'],
	),
	indexes: [
		{ key: { entryHash: 1 }, name: 'activity_hash_unique', unique: true },
		{ key: { actorId: 1, createdAt: -1 }, name: 'activity_actor_idx', partialFilterExpression: { actorId: { $exists: true } } },
		{ key: { 'resource.collection': 1, 'resource.id': 1, createdAt: -1 }, name: 'activity_resource_idx' },
		{ key: { archivedAt: 1 }, name: 'activity_archive_idx', partialFilterExpression: { archivedAt: { $exists: true } } },
	],
}

const questSchema = z.object({
	questId: z.string(),
	status: z.enum(['pending', 'active', 'completed', 'expired']).default('pending'),
	progress: z.number().min(0).max(1).default(0),
	updatedAt: z.date(),
})

const badgeSchema = z.object({
	badgeId: z.string(),
	awardedAt: z.date(),
	metadata: z.record(z.string(), z.any()).optional(),
})

const gamificationStateSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	userId: objectIdSchema,
	xp: z.number().int().nonnegative().default(0),
	level: z.number().int().nonnegative().default(1),
	streak: z.number().int().nonnegative().default(0),
	lastResetAt: z.date().optional(),
	badges: z.array(badgeSchema).default([]),
	quests: z.array(questSchema).default([]),
	pendingRewards: z.array(z.object({ rewardId: z.string(), amount: z.number().int().positive(), expiresAt: z.date().optional() })).default([]),
	metadata: z.record(z.string(), z.any()).optional(),
})

const gamificationStatesDefinition: CollectionDefinition<typeof gamificationStateSchema> = {
	name: 'gamification_states',
	schema: gamificationStateSchema,
	validator: buildJsonSchema(
		{
			userId: { bsonType: 'objectId' },
			xp: { bsonType: 'int' },
			level: { bsonType: 'int' },
			streak: { bsonType: 'int' },
			lastResetAt: { bsonType: 'date' },
			badges: { bsonType: 'array' },
			quests: { bsonType: 'array' },
			pendingRewards: { bsonType: 'array' },
			metadata: { bsonType: 'object' },
		},
		['userId'],
	),
	indexes: [
		{ key: { userId: 1 }, name: 'gamification_user_unique', unique: true },
		{ key: { streak: -1, updatedAt: -1 }, name: 'gamification_streak_idx' },
	],
}

const referralInviteeSchema = z.object({
	userId: objectIdSchema.optional(),
	email: z.string().email().optional(),
	guardianEmail: z.string().email().optional(),
	name: z.string().max(140).optional(),
	channel: z.enum(['email', 'whatsapp', 'share_link']).default('email'),
	status: z.enum(['pending', 'joined', 'rewarded']).default('pending'),
	invitedAt: z.date(),
	joinedAt: z.date().optional(),
	message: z.string().max(500).optional(),
	metadata: z.record(z.string(), z.any()).optional(),
})

const referralSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	referrerUserId: objectIdSchema,
	referralCode: z.string(),
	sourceCampaign: z.string().optional(),
	bonusStatus: z.enum(['pending', 'earned', 'paid']).default('pending'),
	tier: z.enum(['bronze', 'silver', 'gold']).default('bronze'),
	rolling90dCount: z.number().int().nonnegative().default(0),
	lastRewardIssuedAt: z.date().optional(),
	invitees: z.array(referralInviteeSchema).default([]),
	payouts: z.array(z.object({ amount: moneySchema, issuedAt: z.date(), paymentId: objectIdSchema.optional() })).default([]),
	metadata: z.record(z.string(), z.any()).optional(),
})

const referralsDefinition: CollectionDefinition<typeof referralSchema> = {
	name: 'referrals',
	schema: referralSchema,
	validator: buildJsonSchema(
		{
			referrerUserId: { bsonType: 'objectId' },
			referralCode: { bsonType: 'string' },
			sourceCampaign: { bsonType: 'string' },
			bonusStatus: { bsonType: 'string' },
			tier: { bsonType: 'string' },
			rolling90dCount: { bsonType: 'int' },
			lastRewardIssuedAt: { bsonType: 'date' },
			invitees: { bsonType: 'array' },
			payouts: { bsonType: 'array' },
			metadata: { bsonType: 'object' },
		},
		['referrerUserId', 'referralCode'],
	),
	indexes: [
		{ key: { referralCode: 1 }, name: 'referral_code_unique', unique: true },
		{ key: { referrerUserId: 1, createdAt: -1 }, name: 'referral_referrer_idx' },
		{ key: { bonusStatus: 1, updatedAt: -1 }, name: 'referral_bonus_status_idx' },
		{ key: { tier: 1, rolling90dCount: -1 }, name: 'referral_tier_progress_idx' },
	],
}

const advocateHistorySchema = z.object({
	event: z.string(),
	pointsDelta: z.number().int(),
	occurredAt: z.date(),
	notes: z.string().optional(),
})

const advocateSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	programId: z.string(),
	userId: objectIdSchema,
	tier: z.enum(['bronze', 'silver', 'gold', 'platinum']).default('bronze'),
	points: z.number().int().nonnegative().default(0),
	issuedRewards: z.array(z.object({ rewardId: z.string(), amount: moneySchema.optional(), issuedAt: z.date() })).default([]),
	status: z.enum(['active', 'paused', 'removed']).default('active'),
	notes: z.string().optional(),
	history: z.array(advocateHistorySchema).default([]),
})

const advocatesDefinition: CollectionDefinition<typeof advocateSchema> = {
	name: 'advocates',
	schema: advocateSchema,
	validator: buildJsonSchema(
		{
			programId: { bsonType: 'string' },
			userId: { bsonType: 'objectId' },
			tier: { bsonType: 'string' },
			points: { bsonType: 'int' },
			issuedRewards: { bsonType: 'array' },
			status: { bsonType: 'string' },
			notes: { bsonType: 'string' },
			history: { bsonType: 'array' },
		},
		['programId', 'userId'],
	),
	indexes: [
		{ key: { programId: 1, userId: 1 }, name: 'advocate_program_user_unique', unique: true },
		{ key: { tier: 1, points: -1 }, name: 'advocate_tier_points_idx' },
	],
}

const aiRecommendationSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	userId: objectIdSchema,
	context: z.enum(['discovery', 'chat', 'event', 'coach']).default('discovery'),
	modelVersion: z.string(),
	inputSnapshot: z.record(z.string(), z.any()).default({}),
	recommendations: z.array(
		z.object({
			targetId: objectIdSchema.optional(),
			targetType: z.string(),
			score: z.number().min(0).max(1),
			reason: z.string().optional(),
			metadata: z.record(z.string(), z.any()).optional(),
		}),
	).default([]),
	feedback: z.array(z.object({ type: z.enum(['positive', 'negative', 'ignored']), recordedAt: z.date(), payload: z.record(z.string(), z.any()).optional() })).default([]),
	expiresAt: z.date().optional(),
})

const aiRecommendationsDefinition: CollectionDefinition<typeof aiRecommendationSchema> = {
	name: 'ai_recommendations',
	schema: aiRecommendationSchema,
	validator: buildJsonSchema(
		{
			userId: { bsonType: 'objectId' },
			context: { bsonType: 'string' },
			modelVersion: { bsonType: 'string' },
			inputSnapshot: { bsonType: 'object' },
			recommendations: { bsonType: 'array' },
			feedback: { bsonType: 'array' },
			expiresAt: { bsonType: 'date' },
		},
		['userId', 'context', 'modelVersion'],
	),
	indexes: [
		{ key: { userId: 1, context: 1, createdAt: -1 }, name: 'ai_user_context_idx' },
		{ key: { modelVersion: 1, createdAt: -1 }, name: 'ai_model_version_idx' },
		{ key: { expiresAt: 1 }, name: 'ai_recommendation_expiry_ttl', expireAfterSeconds: 0 },
	],
}

const onboardingMediaUploadSchema = z.object({
	type: z.enum(['id', 'selfie', 'voice', 'video']).default('id'),
	uploadKey: z.string(),
	fileUrl: z.string().url().optional(),
	status: z.enum(['requested', 'uploaded', 'approved', 'flagged']).default('requested'),
	aiScore: z.number().min(0).max(1).optional(),
	requestedAt: z.date().optional(),
	scoredAt: z.date().optional(),
})

const onboardingApplicantSchema = withTimestamps({
	_id: objectIdSchema.optional(),
	email: z.string().email(),
	phone: z.string().regex(phoneRegex).optional(),
	status: z.enum(['initiated', 'verified', 'approved']).default('initiated'),
	passkey: z
		.object({
			credentialId: z.string(),
			publicKey: z.string(),
			counter: z.number().int().nonnegative(),
			verifiedAt: z.date(),
		})
		.optional(),
	phoneVerification: z.object({ verified: z.boolean(), verifiedAt: z.date().optional() }).optional(),
	compatibilityDraft: z
		.object({
			personas: z.array(z.object({ id: z.string(), score: z.number().min(0).max(1) })).default([]),
			values: z.array(z.object({ promptId: z.string(), value: z.number().min(0).max(5), note: z.string().optional() })).default([]),
			stage: z.string().default('intro'),
			savedAt: z.date().optional(),
		})
		.optional(),
	mediaUploads: z.array(onboardingMediaUploadSchema).default([]),
	planSelection: z
		.object({ planId: z.string(), priceCents: z.number().int().nonnegative(), interval: z.string(), selectedAt: z.date() })
		.optional(),
	riskScore: z.number().min(0).max(1).optional(),
	lastStep: z.string().optional(),
})

const onboardingApplicantsDefinition: CollectionDefinition<typeof onboardingApplicantSchema> = {
	name: 'onboarding_applicants',
	schema: onboardingApplicantSchema,
	validator: buildJsonSchema(
		{
			email: { bsonType: 'string' },
			phone: { bsonType: 'string' },
			status: { bsonType: 'string' },
			passkey: { bsonType: 'object' },
			phoneVerification: { bsonType: 'object' },
			compatibilityDraft: { bsonType: 'object' },
			mediaUploads: { bsonType: 'array' },
			planSelection: { bsonType: 'object' },
			riskScore: { bsonType: 'double' },
			lastStep: { bsonType: 'string' },
		},
		['email', 'status'],
	),
	indexes: [
		{ key: { email: 1 }, name: 'onboarding_email_unique', unique: true },
		{ key: { status: 1, updatedAt: -1 }, name: 'onboarding_status_idx' },
		{ key: { 'mediaUploads.status': 1 }, name: 'onboarding_media_status_idx' },
	],
}

	const participantSchema = z.object({
		userId: objectIdSchema,
		role: z.enum(['member', 'concierge', 'system']).default('member'),
		unreadCount: z.number().int().nonnegative().default(0),
		lastReadAt: z.date().optional(),
		mutedUntil: z.date().optional(),
	})

	const threadPreviewSchema = z.object({
		text: z.string().max(240).optional(),
		mediaType: z.enum(['image', 'video', 'audio', 'file']).optional(),
	})

	const threadSafetySchema = z.object({
		state: z.enum(['clear', 'flagged', 'restricted']).default('clear'),
		signal: z.string().optional(),
		reviewedAt: z.date().optional(),
	})

	const encryptionEnvelopeSchema = z.object({
		strategy: z.enum(['none', 'placeholder', 'csfle']).default('placeholder'),
		keyVersion: z.string().optional(),
	})

	const chatThreadSchema = withTimestamps({
		_id: objectIdSchema.optional(),
		participantHash: z.string().min(8),
		participants: z.array(participantSchema).min(1),
		type: z.enum(['spark', 'concierge', 'group']).default('spark'),
		topicId: objectIdSchema.optional(),
		createdBy: objectIdSchema,
		lastMessageAt: z.date().optional(),
		lastMessagePreview: threadPreviewSchema.optional(),
		safety: threadSafetySchema.default({ state: 'clear' }),
		encryption: encryptionEnvelopeSchema.default({ strategy: 'placeholder' }),
		metadata: z.record(z.string(), z.any()).optional(),
	})

	const chatThreadsDefinition: CollectionDefinition<typeof chatThreadSchema> = {
		name: 'chat_threads',
		schema: chatThreadSchema,
		validator: buildJsonSchema(
			{
				participantHash: { bsonType: 'string' },
				participants: {
					bsonType: 'array',
					items: {
						bsonType: 'object',
						required: ['userId'],
						properties: {
							userId: { bsonType: 'objectId' },
							role: { bsonType: 'string' },
							unreadCount: { bsonType: 'int' },
							lastReadAt: { bsonType: 'date' },
							mutedUntil: { bsonType: 'date' },
						},
					},
				},
				type: { bsonType: 'string' },
				topicId: { bsonType: 'objectId' },
				createdBy: { bsonType: 'objectId' },
				lastMessageAt: { bsonType: 'date' },
				lastMessagePreview: { bsonType: 'object' },
				safety: { bsonType: 'object' },
				encryption: { bsonType: 'object' },
				metadata: { bsonType: 'object' },
			},
			['participantHash', 'participants', 'createdBy'],
		),
		indexes: [
			{ key: { participantHash: 1 }, name: 'thread_participant_hash_unique', unique: true, partialFilterExpression: { type: 'spark' } },
			{ key: { updatedAt: -1 }, name: 'thread_updated_idx' },
			{ key: { 'safety.state': 1, updatedAt: -1 }, name: 'thread_safety_state_idx' },
			{ key: { topicId: 1 }, name: 'thread_topic_idx', partialFilterExpression: { topicId: { $exists: true } } },
		],
	}

	const attachmentSchema = z.object({
		type: z.enum(['image', 'video', 'audio', 'file']),
		url: z.string().url(),
		sizeBytes: z.number().int().nonnegative(),
		mimeType: z.string(),
		checksum: z.string().optional(),
	})

	const reactionSchema = z.object({
		userId: objectIdSchema,
		emoji: z.string(),
		reactedAt: z.date(),
	})

	const readReceiptSchema = z.object({
		userId: objectIdSchema,
		readAt: z.date(),
	})

	const moderationSchema = z.object({
		state: z.enum(['pending', 'reviewed', 'blocked']).default('pending'),
		reason: z.string().optional(),
		toxicityScore: z.number().min(0).max(1).optional(),
	})

	const chatMessageSchema = withTimestamps({
		_id: objectIdSchema.optional(),
		threadId: objectIdSchema,
		senderId: objectIdSchema,
		body: z.string().max(5000).optional(),
		attachments: z.array(attachmentSchema).default([]),
		reactions: z.array(reactionSchema).default([]),
		readReceipts: z.array(readReceiptSchema).default([]),
		replyToMessageId: objectIdSchema.optional(),
		status: z.enum(['pending', 'sent', 'failed', 'deleted']).default('sent'),
		moderation: moderationSchema.optional(),
		ephemeral: z.object({ expiresAt: z.date(), reason: z.string().optional() }).optional(),
		automation: z.object({ type: z.enum(['ai_opener', 'concierge', 'system']) }).optional(),
		deletedAt: z.date().optional(),
		encryption: encryptionEnvelopeSchema.default({ strategy: 'placeholder' }),
	})

	const chatMessagesDefinition: CollectionDefinition<typeof chatMessageSchema> = {
		name: 'chat_messages',
		schema: chatMessageSchema,
		validator: buildJsonSchema(
			{
				threadId: { bsonType: 'objectId' },
				senderId: { bsonType: 'objectId' },
				body: { bsonType: 'string' },
				attachments: { bsonType: 'array' },
				reactions: { bsonType: 'array' },
				readReceipts: { bsonType: 'array' },
				replyToMessageId: { bsonType: 'objectId' },
				status: { bsonType: 'string' },
				moderation: { bsonType: 'object' },
				ephemeral: { bsonType: 'object' },
				automation: { bsonType: 'object' },
				deletedAt: { bsonType: 'date' },
				encryption: { bsonType: 'object' },
			},
			['threadId', 'senderId'],
		),
		indexes: [
			{ key: { threadId: 1, createdAt: -1 }, name: 'message_thread_created_idx' },
			{ key: { senderId: 1, createdAt: -1 }, name: 'message_sender_idx' },
			{ key: { 'readReceipts.userId': 1, createdAt: -1 }, name: 'message_receipts_idx' },
			{ key: { body: 'text' }, name: 'message_body_text_idx' },
			{ key: { 'ephemeral.expiresAt': 1 }, name: 'message_ephemeral_ttl', expireAfterSeconds: 0 },
		],
	}

export const collectionRegistry = {
	users: usersDefinition,
	profiles: profilesDefinition,
	compatibility_quizzes: compatibilityDefinition,
	matching_snapshots: matchingSnapshotsDefinition,
	discovery_recipes: discoveryRecipesDefinition,
	interaction_events: interactionEventsDefinition,
	matches: matchesDefinition,
	likes: likesDefinition,
	super_likes: superLikesDefinition,
	boost_sessions: boostSessionsDefinition,
	rewinds: rewindsDefinition,
	chat_threads: chatThreadsDefinition,
	chat_messages: chatMessagesDefinition,
	notifications: notificationsDefinition,
	events: eventsDefinition,
	event_registrations: eventRegistrationsDefinition,
	community_clubs: communityClubsDefinition,
	community_posts: communityPostsDefinition,
	community_comments: communityCommentsDefinition,
	reports: reportsDefinition,
	moderation_actions: moderationActionsDefinition,
	trust_events: trustEventsDefinition,
	liveness_sessions: livenessSessionsDefinition,
	guardian_invite_requests: guardianInviteRequestsDefinition,
	subscriptions: subscriptionsDefinition,
	payments: paymentsDefinition,
	wallet_configs: walletConfigsDefinition,
	invoices: invoicesDefinition,
	entitlements: entitlementsDefinition,
	analytics_snapshots: analyticsSnapshotsDefinition,
	funnel_metrics: funnelMetricsDefinition,
	cohort_metrics: cohortMetricsDefinition,
	activity_logs: activityLogsDefinition,
	gamification_states: gamificationStatesDefinition,
	referrals: referralsDefinition,
	advocates: advocatesDefinition,
	ai_recommendations: aiRecommendationsDefinition,
	onboarding_applicants: onboardingApplicantsDefinition,
} as const

export type CollectionRegistry = typeof collectionRegistry
export type CollectionName = keyof CollectionRegistry
export const collections: CollectionDefinition<any>[] = Object.values(collectionRegistry)
