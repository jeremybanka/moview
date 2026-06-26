Scaffolding is done.

Now, let's make an app. This app is a place for friends who have a running "movie night" to maintain a casual **pool** and **upcoming queue** of movies they would like to remember to watch together, as well as an official **turn order** which is not physically connected to queue but acts a suggestion.

# Stories

## Jeremy adds a movie to the group pool. It gets an image and description pulled from a free and open source

## Jeremy adds three additional movies to the group pool
- His movies have rank 1.000, 2.000, 3.000, and 4.000 respectively (see **rank** later)

## Jeremy logs in

## Jeremy creates a group

## Jeremy invites Moira to the group

## It's movie night and we find out whose turn it is

## It's Jeremy's turn! He finds a movie in the group pool tagged with his face and puts at the top of the queue in the "on deck" position

## Moira already put 12 movies in the queue. That's okay. Peter adds one in the second upcoming position

## Moira returns a couple of her upcoming movies to the pool from the queue

## Jeremy adds a movie Moira already added. He becomes not the **contributor** but another **advocate** to the movie
- Thus a **advocates** join table between groups, users, and movies. Unique on compound key group+movie+advocate#. (The first Advocate == Contributor)
- That's why Jeremy can't be the contributor: Moira already contributed that movie to the group. Her advocate number is 1, so Jeremy's is 2.

## Peter adds a movie from Jeremy's queue to the "on deck" position

## Moira creates her own separate group and invites Bug

## Peter goes to his **personal view** in the group. 
- The personal view is the pool, but filtered to only movies Peter **contributed** or is an **advocate** for 
- The personal view has a special order that only he chooses.
- The order is driven by a stat called **rank** which is a column on the advocates table.
- Rank is a float that is _only_ applied in personal view  
- On **advocates** table, group+user+rank must be unique

## Peter, who has 10 movies in the pool, moves his middle-ranked movie, _Tiptoes_ (which happens to have rank 63.1065076) to the end of his **personal view** 
- The rank of _Tiptoes_ becomes 104, the next whole number after the previous last movie in his personal view, _Happily N'ever After_ which still has a rank of 103.463603701

## Peter, who has 10 movies in the pool, then moves his top-ranked movie, _The Red Baron_ (which happens to have rank 12.130561) between _Tiptoes_ and _Happily N'ever After_ 
- The rank of _The Red Baron_ becomes ((104 - 103.463603701) / 2) + 103.463603701, right between its new neighbors. That way the list is sorted properly, for him, in this view.

## At the end of movie night, Jeremy, Moira, and Peter add their reviews
- They each add to Movie Group Reviews, which is a table joining user+movie+group with its own ids. With a column "goodness_of_pick" (Int, allowed to be negative) 
- They each add to Movie Individual Review, which is a table joining user+movie with its own ids. With a column "rating" (Int, allowed to be negative). Also a column "feelings" (text, large, nullable)
- There should be like, a group ready status where you can observe the rest of the group getting their reviews done.
- This screen after making reviews should be a summary page with average and broken-down ratings, goodness of pick, and all feelings.

# History page
- Sort by date_watched, sort by goodness_of_pick, sort by rating

## Deploy this app to a celilo environment
- register www.moview.com
- set up caddy
- deploying an LXC thru Proxmox
- create an OIDC app connection into Authentik
- create a smoke-test user
- validate login with smoke-test user
- create first admin account
- make password for the admin account available to the operator
