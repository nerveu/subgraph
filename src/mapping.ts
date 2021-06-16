import { BigInt } from "@graphprotocol/graph-ts"
import { log } from '@graphprotocol/graph-ts'
import {
  BetBailout,
  BetClosed,
  BetCreated,
  BetFinished,
  BetJoined,
  BetProved,
  BetRedeemed,
  DisplayAchievementChanged,
  NameRegistered,
  RecipientRedeemed,
  SocialRegistered,
  TaskAdded,
  TaskJoined,
  TaskProved,
  UserBlacklisted,
  UserRedeemed,
  Voted
} from "../generated/NerveGlobal/NerveGlobal"
import { 
  Task, 
  UserTask,
  Bet,
  UserBet,
  UserFavStats,
  UserDashStats,
  UserAchievements,
  GlobalStats
} from "../generated/schema"


  /******************************************/
  /*             Initialization             */
  /******************************************/

function initializeUserFavStats (id: string): void {
  let userFavStats = new UserFavStats(id)
  userFavStats.negativeVotes = BigInt.fromI32(0)
  userFavStats.positiveVotes = BigInt.fromI32(0)
  userFavStats.betBalance = BigInt.fromI32(0)
  userFavStats.betsWon = BigInt.fromI32(0)
  userFavStats.betsLost = BigInt.fromI32(0)

}

function initializeUserDashStats (id: string): void {
  let userDashStats = new UserDashStats(id)
  userDashStats.userName = "Unknown"
  userDashStats.displayAchievement = "None"
  userDashStats.youtube = "None"
  userDashStats.twitter = "None"
  userDashStats.instagram = "None"
  userDashStats.tiktok = "None"
  userDashStats.twitch = "None"
  userDashStats.tribute = BigInt.fromI32(0)
  userDashStats.profit = BigInt.fromI32(0)
  userDashStats.blacklist = []
}

function initializeUserAchievements (id: string): void {
  let userAchievements = new UserAchievements(id)
  userAchievements.tasksCreated = BigInt.fromI32(0)
  userAchievements.tasksJoined = BigInt.fromI32(0)
  userAchievements.tasksVoted = BigInt.fromI32(0)
  userAchievements.betsCreated = BigInt.fromI32(0)
  userAchievements.betsJoined = BigInt.fromI32(0)
  userAchievements.betsFinished = BigInt.fromI32(0)
  userAchievements.accountCreation = BigInt.fromI32(0)
  userAchievements.seasonOneRank = BigInt.fromI32(0)
  userAchievements.seasonTwoRank = BigInt.fromI32(0)
  userAchievements.seasonThreeRank = BigInt.fromI32(0)
  
  let globalStatsId = "1"
  let globalStats = GlobalStats.load(globalStatsId)
  if(globalStats == null) {
    initializeGlobalStats(globalStatsId)
  }
  globalStats.users = globalStats.users.plus(BigInt.fromI32(1))
  globalStats.save()
}

function initializeGlobalStats (id: string): void {
  let globalStats = new GlobalStats(id)
  globalStats.taskProfits = BigInt.fromI32(0)
  globalStats.users = BigInt.fromI32(0)
  globalStats.taskCount = BigInt.fromI32(0)
  globalStats.betProfit = BigInt.fromI32(0)
  globalStats.betCount = BigInt.fromI32(0)
}

  /******************************************/
  /*               BetCreated               */
  /******************************************/

export function handleBetCreated(event: BetCreated): void {

  // Bet Entity
  let bet = new Bet(event.params.betID.toHex())
  log.info('New Bet entity created: {}', [event.params.betID.toHex()])
  bet.initiatorAddress = event.params.initiator 
  bet.description = event.params.description 
  bet.textA = event.params.yesText 
  bet.textB = event.params.noText 
  bet.endBet = event.params.endBet 
  bet.hashtag1 = event.params.hashtag1 
  bet.hashtag2 = event.params.hashtag2 
  bet.hashtag3 = event.params.hashtag3 
  bet.language = event.params.language 
  bet.save()

  // UserBet Entity
  let userBet = new UserBet(event.params.initiator.toHex() + "-" + event.params.betID.toHex())
  log.info('New UserBet entity created: {} - {}', [event.params.initiator.toHex(), event.params.betID.toHex()])
  userBet.userAddress = event.params.initiator 
  userBet.betData = event.params.betID.toHex()
  userBet.userStake = BigInt.fromI32(0)
  userBet.save()

  // UserAchievements Entity
  let userAchievementsid = event.params.initiator.toHex()                                               //hier
  let userAchievements = UserAchievements.load(userAchievementsid)
  log.debug('Trying to load userAchievements with ID: {} | {}', [userAchievementsid, event.params.initiator.toHex()])
  if(userAchievements == null) {
    initializeUserAchievements(userAchievementsid)
    log.info('New UserAchievements entity created: {}', [event.params.initiator.toHex()])
  }
  userAchievements.betsCreated = userAchievements.betsCreated.plus(BigInt.fromI32(1)) 
  userAchievements.save()
  
  // GlobalStats Entity                                                                   //hier
  let globalStatsId = "1"
  let globalStats = GlobalStats.load(globalStatsId)
  if(globalStats == null) {
    initializeGlobalStats(globalStatsId)
  }
  globalStats.betCount = globalStats.betCount.plus(BigInt.fromI32(1)) 
  globalStats.save()
}

  /******************************************/
  /*               BetJoined                */
  /******************************************/

export function handleBetJoined(event: BetJoined): void {

  // Bet Entity
  let bet = Bet.load(event.params.betID.toHex())
  if (event.params.joinA == true) {
    bet.stakeA = bet.stakeA.plus(event.params.amount) 
    bet.participantsA = bet.participantsA.plus(BigInt.fromI32(1)) 
  } else {
    bet.stakeB = bet.stakeB.plus(event.params.amount) 
    bet.participantsB = bet.participantsB.plus(BigInt.fromI32(1))
  }
  bet.save()

  // UserBet Entity
  let userBet = new UserBet(event.params.participant.toHex() + "-" + event.params.betID.toHex())
  log.info('New UserBet entity created: {} - {}', [event.params.participant.toHex(), event.params.betID.toHex()])
  userBet.userAddress = event.params.participant 
  userBet.userStake = event.params.amount
  userBet.joinedA = event.params.joinA
  userBet.betData = event.params.betID.toHex()
  userBet.save()

  // UserFavStats Entity
  let userFavStatsId = event.params.participant.toHex()
  let userFavStats = UserFavStats.load(userFavStatsId)
  if(userFavStats == null) {
    initializeUserFavStats(userFavStatsId)
    log.info('New UserFavStats entity created: {}', [event.params.participant.toHex()])
  }
  userFavStats.betBalance.minus(event.params.amount)
  userFavStats.save()

  // UserAchievement Entity
  let userAchievementsId = event.params.participant.toHex()
  let userAchievements = UserAchievements.load(userAchievementsId)
  if(userAchievements == null) {
    initializeUserAchievements(userAchievementsId)
    log.info('New UserAchievement entity created: {}', [event.params.participant.toHex()])
  }
  userAchievements.betsJoined = userAchievements.betsJoined.plus(BigInt.fromI32(1))
  userAchievements.save()
}

  /******************************************/
  /*               BetClosed                */
  /******************************************/

export function handleBetClosed(event: BetClosed): void {

  // Bet Entity
  let bet = Bet.load(event.params.betID.toHex())
  bet.noMoreBets = true
  bet.save()
}

  /******************************************/
  /*               BetFinished              */
  /******************************************/

export function handleBetFinished(event: BetFinished): void {

  // Bet Entity
  let bet = Bet.load(event.params.betID.toHex())
  bet.finished = true 
  bet.failed = event.params.failed                       
  bet.winnerPartyA = event.params.winnerPartyA
  bet.draw = event.params.draw 
  bet.save()

  // UserAchievements Entity
  let userAchievements = UserAchievements.load(event.params.initiator.toHex())
  userAchievements.betsFinished = userAchievements.betsFinished.plus(BigInt.fromI32(1)) 
  userAchievements.save()
}

  /******************************************/
  /*               BetRedeemed              */
  /******************************************/

export function handleBetRedeemed(event: BetRedeemed): void {

  // Bet Entity
  let bet = Bet.load(event.params.betID.toHex())
  
  // 1/2 UserBet Entity
  let userBet = UserBet.load(event.params.participant.toHex() + "-" + event.params.betID.toHex())
  userBet.redeemed = true

  // UserFavStats Entity
  let userFavStatsId = event.params.participant.toHex()
  let userFavStats = UserFavStats.load(userFavStatsId)
  if(userFavStats == null) {
    initializeUserFavStats(userFavStatsId)
    log.info('New UserFacStats entity created: {}', [event.params.participant.toHex()])
  }
  userFavStats.betsWon = userFavStats.betsWon.plus(BigInt.fromI32(1)) 
  userFavStats.betBalance = userFavStats.betBalance.plus(event.params.profit)
  userFavStats.betBalance = userFavStats.betBalance.plus(userBet.userStake)
  userFavStats.save()
  
  // 2/2 UserBet Entity
  userBet.userStake = BigInt.fromI32(0)
  userBet.save()

  // GlobalStats Entity
  let globalStatsId = "1"
  let globalStats = GlobalStats.load(globalStatsId)
  if(globalStats == null) {
    initializeGlobalStats(globalStatsId)
  }
  globalStats.betProfit = globalStats.betProfit.plus(event.params.profit) 
  globalStats.save()
}

  /******************************************/
  /*               BetBailout               */
  /******************************************/

export function handleBetBailout(event: BetBailout): void {

  // UserBet Entity
  let userBet = UserBet.load(event.params.participant.toHex() + "-" + event.params.betID.toHex())
  userBet.userStake = BigInt.fromI32(0)
  userBet.save()

  // UserFavStats Entity
  let userFavStatsId = event.params.participant.toHex()
  let userFavStats = UserFavStats.load(userFavStatsId)
  if(userFavStats == null) {
    initializeUserFavStats(userFavStatsId)
    log.info('New UserFavStats entity created: {}', [event.params.participant.toHex()])
  }
  userFavStats.betBalance = userFavStats.betBalance.plus(event.params.userStake)
  userFavStats.save()
}

  /******************************************/
  /*               BetProved                */
  /******************************************/
  
export function handleBetProved(event: BetProved): void {
  let bet = Bet.load(event.params.betID.toHex())
  bet.proofLink = event.params.proofLink
  bet.save()
}



  //****************************************************************************** */




  /******************************************/
  /*               TaskAdded                */
  /******************************************/

export function handleTaskAdded(event: TaskAdded): void {
  
  // Task Entity
  let task = new Task(event.params.taskID.toHex())
  log.info('New Task entity created: {}', [event.params.taskID.toHex()])
  task.initiatorAddress = event.params.initiator
  task.recipientAddress = event.params.recipient
  task.amount = event.params.amount
  task.entranceAmount = event.params.amount
  task.description = event.params.description
  task.endTask = event.params.endTask
  task.participants = BigInt.fromI32(1)
  task.hashtag1 = event.params.hashtag1
  task.hashtag2 = event.params.hashtag2
  task.hashtag3 = event.params.hashtag3
  task.language = event.params.language
  task.save()

  // UserTask Entity
  let userTask = new UserTask(event.params.initiator.toHex() + "-" + event.params.taskID.toHex())
  log.info('New UserTask entity created: {} - {}', [event.params.initiator.toHex(), event.params.taskID.toHex()])
  userTask.userAddress = event.params.initiator
  userTask.userStake = event.params.amount
  userTask.taskData = event.params.taskID.toHex()
  userTask.save()

  // UserAchievements Entity
  let userAchievementsId = event.params.initiator.toHex()
  let userAchievements = UserAchievements.load(userAchievementsId)
  if(userAchievements == null) {
    initializeUserAchievements(userAchievementsId)
    log.info('New UserAchievements entity created: {}', [event.params.initiator.toHex()])
  }
  userAchievements.tasksCreated = userAchievements.tasksCreated.plus(BigInt.fromI32(1))
  userAchievements.save()                                                                   //hier

  // GlobalStats Entity
  let globalStatsId = "1"
  let globalStats = GlobalStats.load(globalStatsId)
  if(globalStats == null) {
    initializeGlobalStats(globalStatsId)
  }
  globalStats.taskCount = globalStats.taskCount.plus(BigInt.fromI32(1)) 
  globalStats.save()
}

  /******************************************/
  /*               TaskJoined               */
  /******************************************/

export function handleTaskJoined(event: TaskJoined): void {
  
  // Task Entity
  let task = Task.load(event.params.taskID.toHex())
  task.participants = task.participants.plus(BigInt.fromI32(1))
  task.amount = task.amount.plus(event.params.amount)
  task.save()

  // UserTask Entity
  let userTask = new UserTask(event.params.participant.toHex() + "-" + event.params.taskID.toHex())
  log.info('New UserTask entity created: {} - {}', [event.params.participant.toHex(), event.params.taskID.toHex()])
  userTask.userAddress = event.params.participant
  userTask.userStake = event.params.amount
  userTask.taskData = event.params.taskID.toHex()
  userTask.save()

  // UserDashStats Entity
  let userDashStatsId = event.params.participant.toHex()
  let userDashStats = UserDashStats.load(userDashStatsId)
  if(userDashStats == null) {
    initializeUserDashStats(userDashStatsId)
    log.info('New UserDashStats entity created: {}', [event.params.participant.toHex()])
  }
  userDashStats.tribute = userDashStats.tribute.plus(event.params.amount)
  userDashStats.save()                                                                    //hier

  // UserAchievements Entity
  let userAchievementsId = event.params.participant.toHex()
  let userAchievements = UserAchievements.load(userAchievementsId)
  if(userAchievements == null) {
    initializeUserAchievements(userAchievementsId)
    log.info('New UserAchievements entity created: {}', [event.params.participant.toHex()])
  }
  userAchievements.tasksJoined = userAchievements.tasksJoined.plus(BigInt.fromI32(1))
  userAchievements.save()                                                                  //hier
}

  /******************************************/
  /*                 Voted                  */
  /******************************************/

export function handleVoted(event: Voted): void {
  
  // Task Entity
  let task = Task.load(event.params.taskID.toHex())
  if (event.params.vote == true) {
    task.positiveVotes = task.positiveVotes.plus(BigInt.fromI32(1))
  } else {
    task.negativeVotes = task.negativeVotes.plus(BigInt.fromI32(1))
  }
  task.finished = event.params.finished
  task.save()

  // UserTask Entity
  let userTask = UserTask.load(event.params.participant.toHex() + "-" + event.params.taskID.toHex())
  userTask.voted = true
  userTask.vote = event.params.vote
  userTask.save()

  // UserFavStats Entity
  let userFavStatsId = event.params.participant.toHex()
  let userFavStats = UserFavStats.load(userFavStatsId)
  if(userFavStats == null) {
    initializeUserFavStats(userFavStatsId)
    log.info('New UserFavStats entity created: {}', [event.params.participant.toHex()])
  }
  if (event.params.vote == true) {
    userFavStats.positiveVotes = userFavStats.positiveVotes.plus(BigInt.fromI32(1))
  } else {
    userFavStats.negativeVotes = userFavStats.negativeVotes.plus(BigInt.fromI32(1))
  }
  userFavStats.save()                                                                             //hier

  // UserAchievements Entity
  let userAchievementsId = event.params.participant.toHex()
  let userAchievements = UserAchievements.load(userAchievementsId)
  if(userAchievements == null) {
    initializeUserAchievements(userAchievementsId)
    log.info('New UserAchievements entity created: {}', [event.params.participant.toHex()])
  }
  userAchievements.tasksVoted = userAchievements.tasksVoted.plus(BigInt.fromI32(1))
  userAchievements.save()                                                                         //hier
}

  /******************************************/
  /*              UserRedeemed              */
  /******************************************/

export function handleUserRedeemed(event: UserRedeemed): void {

  // UserTask Entity
  let userTask = UserTask.load(event.params.participant.toHex() + "-" + event.params.taskID.toHex())
  userTask.userStake = BigInt.fromI32(0)
  userTask.save()

  // UserDashStats Entity
  let id = event.params.participant.toHex()
  let userDashStats = UserDashStats.load(id)
  if(userDashStats == null) {
    initializeUserDashStats(id)
    log.info('New UserDashStats entity created: {}', [event.params.participant.toHex()])
  }
  userDashStats.tribute.minus(event.params.amount)
  userDashStats.save()                                                                      //hier
}

  /******************************************/
  /*            RecipientRedeemed           */
  /******************************************/

export function handleRecipientRedeemed(event: RecipientRedeemed): void {

  // Task Entity
  let task = Task.load(event.params.taskID.toHex())
  task.executed = true
  task.save()

  // UserTask Entity
  let userTask = UserTask.load(event.params.recipient.toHex() + "-" + event.params.taskID.toHex())
  userTask.userStake = BigInt.fromI32(0)
  userTask.save()

  // UserDashStats Entity
  let id = event.params.recipient.toHex()
  let userDashStats = UserDashStats.load(id)
  if(userDashStats == null) {
    initializeUserDashStats(id)
    log.info('New UserDashStats entity created: {}', [event.params.recipient.toHex()])
  }
  userDashStats.profit = userDashStats.profit.plus(event.params.amount)
  userDashStats.save()                                                                  //hier

  // GlobalStats Entity
  let globalStatsId = "1"
  let globalStats = GlobalStats.load(globalStatsId)
  if(globalStats == null) {
    initializeGlobalStats(globalStatsId)
  }
  globalStats.taskProfits = globalStats.taskProfits.plus(event.params.amount) 
  globalStats.save()
}

  /******************************************/
  /*              TaskProved                */
  /******************************************/

export function handleTaskProved(event: TaskProved): void {

  // Task Entity
  let task = Task.load(event.params.taskID.toHex())
  task.proofLink = event.params.proofLink
  task.save()
}

  /******************************************/
  /*             NameRegistered             */
  /******************************************/

export function handleNameRegistered(event: NameRegistered): void {

  //  UserDashStats Entity
  let id = event.params.user.toHex()
  let userDashStats = UserDashStats.load(id)
  if(userDashStats == null) {
    initializeUserDashStats(id)
    log.info('New UserDashStats entity created: {}', [event.params.user.toHex()])
  }
  userDashStats.userName = event.params.registeredName.toHex()
  userDashStats.save()                                                              //hier
}

  /******************************************/
  /*            SocialRegistered            */
  /******************************************/

export function handleSocialRegistered(event: SocialRegistered): void {

  // UserDashStats Entity
  let id = event.params.user.toHex()
  let userDashStats = UserDashStats.load(id)
  if(userDashStats == null) {
    initializeUserDashStats(id)
    log.info('New UserDashStats entity created: {}', [event.params.user.toHex()])
  }
  if(event.params.socialID == BigInt.fromI32(1))
    userDashStats.instagram = event.params.registeredLink.toString()
  if(event.params.socialID == BigInt.fromI32(2))
    userDashStats.twitter = event.params.registeredLink.toString()
  if(event.params.socialID == BigInt.fromI32(3))
    userDashStats.tiktok = event.params.registeredLink.toString()
  if(event.params.socialID == BigInt.fromI32(4))
    userDashStats.twitch = event.params.registeredLink.toString()
  if(event.params.socialID == BigInt.fromI32(5))
    userDashStats.youtube = event.params.registeredLink.toString()
  userDashStats.save()                                                          //hier
}

  /******************************************/
  /*            UserBlacklisted             */
  /******************************************/

export function handleUserBlacklisted(event: UserBlacklisted): void {

  // UserDashStats Entity
  let id = event.params.user.toHex()
  let userDashStats = UserDashStats.load(id)
  if(userDashStats == null) {
    initializeUserDashStats(id)
    log.info('New UserDashStats entity created: {}', [event.params.user.toHex()])
  }
  userDashStats.blacklist.push(event.params.userToBlacklist)
  userDashStats.save()                                                          //hier
}

  /******************************************/
  /*       DisplayAchievementChanged        */
  /******************************************/

export function handleDisplayAchievementChanged(event: DisplayAchievementChanged): void {
  
  // UserDashStats Entity
  let id = event.params.user.toHex()
  let userDashStats = UserDashStats.load(id)
  if(userDashStats == null) {
    initializeUserDashStats(id)
    log.info('New UserDashStats entity created: {}', [event.params.user.toHex()])
  }
  userDashStats.displayAchievement = event.params.achievement
  userDashStats.save()                                                          //hier
}
