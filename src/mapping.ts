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
  userBet.save()

  // UserAchievements Entity
  let userAchievementsId = event.params.initiator.toHex()
  let userAchievements = UserAchievements.load(userAchievementsId)
  if(userAchievements == null) {
    userAchievements = new UserAchievements(userAchievementsId)
    log.info('New UserAchievements entity created: {}', [event.params.initiator.toHex()])

    // GlobalStats Entity
    let globalStatsId = "1"
    let globalStats = GlobalStats.load(globalStatsId)
    if(globalStats == null) {
      globalStats = new GlobalStats(globalStatsId)
    }
    globalStats.users.plus(BigInt.fromI32(1))
    globalStats.save()
  }
  userAchievements.betsCreated.plus(BigInt.fromI32(1)) 
  userAchievements.save()
}

  /******************************************/
  /*               BetJoined                */
  /******************************************/

export function handleBetJoined(event: BetJoined): void {

  // Bet Entity
  let bet = Bet.load(event.params.betID.toHex())
  if (event.params.joinA == true) {
    bet.stakeA.plus(event.params.amount) 
    bet.participantsA.plus(BigInt.fromI32(1)) 
  } else {
    bet.stakeB.plus(event.params.amount) 
    bet.participantsB.plus(BigInt.fromI32(1))
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
    userFavStats = new UserFavStats(userFavStatsId)
    log.info('New UserFavStats entity created: {}', [event.params.participant.toHex()])
  }
  userFavStats.betBalance.minus(event.params.amount)
  userFavStats.save()

  // UserAchievement Entity
  let userAchievementsId = event.params.participant.toHex()
  let userAchievements = UserAchievements.load(userAchievementsId)
  if(userAchievements == null) {
    userAchievements = new UserAchievements(userAchievementsId)
    log.info('New UserAchievement entity created: {}', [event.params.participant.toHex()])

    // GlobalStats Entity
    let globalStatsId = "1"
    let globalStats = GlobalStats.load(globalStatsId)
    if(globalStats == null) {
      globalStats = new GlobalStats(globalStatsId)
    }
    globalStats.users.plus(BigInt.fromI32(1))
    globalStats.save()
  }
  userAchievements.betsJoined.plus(BigInt.fromI32(1))
  userAchievements.save()

  // GlobalStats Entity
  let globalStatsId = "1"
  let globalStats = GlobalStats.load(globalStatsId)
  if(globalStats == null) {
    globalStats = new GlobalStats(globalStatsId)
  }
  globalStats.users.plus(BigInt.fromI32(1)) 
  globalStats.save()
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
  userAchievements.betsFinished.plus(BigInt.fromI32(1)) 
  userAchievements.save()

  // GlobalStats Entity
  if(event.params.failed == false && event.params.draw == false) {
    let globalStatsId = "1"
    let globalStats = GlobalStats.load(globalStatsId)
    if(globalStats == null) {
      globalStats = new GlobalStats(globalStatsId)
    }
    globalStats.betCount.plus(BigInt.fromI32(1))
    globalStats.save()
  }  
}

  /******************************************/
  /*               BetRedeemed              */
  /******************************************/

export function handleBetRedeemed(event: BetRedeemed): void {

  // Bet Entity
  let bet = Bet.load(event.params.betID.toHex())

  // UserBet Entity
  let userBet = UserBet.load(event.params.participant.toHex() + "-" + event.params.betID.toHex())
  userBet.redeemed = true
  userBet.userStake = BigInt.fromI32(0)
  userBet.save()

  // UserFavStats Entity
  let userFavStatsId = event.params.participant.toHex()
  let userFavStats = UserFavStats.load(userFavStatsId)
  if(userFavStats == null) {
    userFavStats = new UserFavStats(userFavStatsId)
    log.info('New UserFacStats entity created: {}', [event.params.participant.toHex()])
  }
  userFavStats.betsWon.plus(BigInt.fromI32(1)) 
  userFavStats.betBalance.plus(event.params.profit)
  userFavStats.betBalance.plus(userBet.userStake)
  userFavStats.save()

  // GlobalStats Entity
  let globalStatsId = "1"
  let globalStats = GlobalStats.load(globalStatsId)
  if(globalStats == null) {
    globalStats = new GlobalStats(globalStatsId)
  }
  globalStats.betProfit.plus(event.params.profit) 
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
  let id = event.params.participant.toHex()
  let userFavStats = UserFavStats.load(id)
  if(userFavStats == null) {
    userFavStats = new UserFavStats(id)
    log.info('New UserFavStats entity created: {}', [event.params.participant.toHex()])
  }
  userFavStats.betBalance.plus(event.params.userStake)
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
    userAchievements = new UserAchievements(userAchievementsId)
    log.info('New UserAchievements entity created: {}', [event.params.initiator.toHex()])
    
    // GlobalStats Entity
    let globalStatsId = "1"
    let globalStats = GlobalStats.load(globalStatsId)
    if(globalStats == null) {
      globalStats = new GlobalStats(globalStatsId)
    }
    globalStats.users.plus(BigInt.fromI32(1))
    globalStats.save()
  }
  userAchievements.tasksCreated.plus(BigInt.fromI32(1))

  // GlobalStats Entity
  let globalStatsId = "1"
  let globalStats = GlobalStats.load(globalStatsId)
  if(globalStats == null) {
    globalStats = new GlobalStats(globalStatsId)
  }
  globalStats.taskCount.plus(BigInt.fromI32(1)) 
  globalStats.save()
}

  /******************************************/
  /*               TaskJoined               */
  /******************************************/

export function handleTaskJoined(event: TaskJoined): void {
  
  // Task Entity
  let task = Task.load(event.params.taskID.toHex())
  task.participants.plus(BigInt.fromI32(1))
  task.amount.plus(event.params.amount)
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
    userDashStats = new UserDashStats(userDashStatsId)
    log.info('New UserDashStats entity created: {}', [event.params.participant.toHex()])
  }
  userDashStats.tribute.plus(event.params.amount)

  // UserAchievements Entity
  let userAchievementsId = event.params.participant.toHex()
  let userAchievements = UserAchievements.load(userAchievementsId)
  if(userAchievements == null) {
    userAchievements = new UserAchievements(userAchievementsId)
    log.info('New UserAchievements entity created: {}', [event.params.participant.toHex()])
    
    // GlobalStats Entity
    let globalStatsId = "1"
    let globalStats = GlobalStats.load(globalStatsId)
    if(globalStats == null) {
      globalStats = new GlobalStats(globalStatsId)
    }
    globalStats.users.plus(BigInt.fromI32(1))
    globalStats.save()
  }
  userAchievements.tasksJoined.plus(BigInt.fromI32(1))
}

  /******************************************/
  /*                 Voted                  */
  /******************************************/

export function handleVoted(event: Voted): void {
  
  // Task Entity
  let task = Task.load(event.params.taskID.toHex())
  if (event.params.vote == true) {
    task.positiveVotes.plus(BigInt.fromI32(1))
  } else {
    task.negativeVotes.plus(BigInt.fromI32(1))
  }
  task.finished = event.params.finished
  task.save()

  // UserTask Entity
  let userTask = UserTask.load(event.params.participant.toHex() + "-" + event.params.taskID.toHex())
  userTask.voted = true
  userTask.vote = event.params.vote
  userTask.save()

  // UserFavStats Entity
  let id = event.params.participant.toHex()
  let userFavStats = UserFavStats.load(id)
  if(userFavStats == null) {
    userFavStats = new UserFavStats(id)
    log.info('New UserFavStats entity created: {}', [event.params.participant.toHex()])
  }
  if (event.params.vote == true) {
    userFavStats.positiveVotes.plus(BigInt.fromI32(1))
  } else {
    userFavStats.negativeVotes.plus(BigInt.fromI32(1))
  }

  // UserAchievements Entity
  let userAchievementsId = event.params.participant.toHex()
  let userAchievements = UserAchievements.load(userAchievementsId)
  if(userAchievements == null) {
    userAchievements = new UserAchievements(userAchievementsId)
    log.info('New UserAchievements entity created: {}', [event.params.participant.toHex()])
  }
  userAchievements.tasksVoted.plus(BigInt.fromI32(1))
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
    userDashStats = new UserDashStats(id)
    log.info('New UserDashStats entity created: {}', [event.params.participant.toHex()])
  }
  userDashStats.tribute.minus(event.params.amount)
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
    userDashStats = new UserDashStats(id)
    log.info('New UserDashStats entity created: {}', [event.params.recipient.toHex()])
  }
  userDashStats.profit.plus(event.params.amount)

  // GlobalStats Entity
  let globalStatsId = "1"
  let globalStats = GlobalStats.load(globalStatsId)
  if(globalStats == null) {
    globalStats = new GlobalStats(globalStatsId)
  }
  globalStats.taskProfits.plus(event.params.amount) 
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
    userDashStats = new UserDashStats(id)
    log.info('New UserDashStats entity created: {}', [event.params.user.toHex()])
  }
  userDashStats.userName = event.params.registeredName.toHex()
}

  /******************************************/
  /*            SocialRegistered            */
  /******************************************/

export function handleSocialRegistered(event: SocialRegistered): void {

  // UserDashStats Entity
  let id = event.params.user.toHex()
  let userDashStats = UserDashStats.load(id)
  if(userDashStats == null) {
    userDashStats = new UserDashStats(id)
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
}

  /******************************************/
  /*            UserBlacklisted             */
  /******************************************/

export function handleUserBlacklisted(event: UserBlacklisted): void {

  // UserDashStats Entity
  let id = event.params.user.toHex()
  let userDashStats = UserDashStats.load(id)
  if(userDashStats == null) {
    userDashStats = new UserDashStats(id)
    log.info('New UserDashStats entity created: {}', [event.params.user.toHex()])
  }
  userDashStats.blacklist.push(event.params.userToBlacklist)
}

  /******************************************/
  /*       DisplayAchievementChanged        */
  /******************************************/

export function handleDisplayAchievementChanged(event: DisplayAchievementChanged): void {
  
  // UserDashStats Entity
  let id = event.params.user.toHex()
  let userDashStats = UserDashStats.load(id)
  if(userDashStats == null) {
    userDashStats = new UserDashStats(id)
    log.info('New UserDashStats entity created: {}', [event.params.user.toHex()])
  }
  userDashStats.displayAchievement = event.params.achievement
}