create table if not exists `account_workspaces` (
  `userId` int not null primary key,
  `backupJson` text not null,
  `updatedAt` timestamp not null default current_timestamp on update current_timestamp,
  constraint `account_workspaces_user_fk` foreign key (`userId`) references `users` (`id`) on delete cascade
);
