-- psql -h 127.0.0.1 -U keycloak -d keycloak -f umami/sql/schema.postgresql.sql --

drop table if exists umami.event;
drop table if exists umami.pageview;
drop table if exists umami.session;
drop table if exists umami.website;
drop table if exists umami.account;

create table umami.account (
    user_id serial primary key,
    username varchar(255) unique not null,
    password varchar(60) not null,
    is_admin bool not null default false,
    created_at timestamp with time zone default current_timestamp,
    updated_at timestamp with time zone default current_timestamp
);

create table umami.website (
    website_id serial primary key,
    website_uuid uuid unique not null,
    user_id int not null references umami.account(user_id) on delete cascade,
    name varchar(100) not null,
    domain varchar(500),
    share_id varchar(64) unique,
    created_at timestamp with time zone default current_timestamp
);

create table umami.session (
    session_id serial primary key,
    session_uuid uuid unique not null,
    website_id int not null references umami.website(website_id) on delete cascade,
    created_at timestamp with time zone default current_timestamp,
    hostname varchar(100),
    browser varchar(20),
    os varchar(20),
    device varchar(20),
    screen varchar(11),
    language varchar(35),
    country char(2)
);

create table umami.pageview (
    view_id serial primary key,
    website_id int not null references umami.website(website_id) on delete cascade,
    session_id int not null references umami.session(session_id) on delete cascade,
    created_at timestamp with time zone default current_timestamp,
    url varchar(500) not null,
    referrer varchar(500)
);

create table umami.event (
    event_id serial primary key,
    website_id int not null references umami.website(website_id) on delete cascade,
    session_id int not null references umami.session(session_id) on delete cascade,
    created_at timestamp with time zone default current_timestamp,
    url varchar(500) not null,
    event_type varchar(50) not null,
    event_value varchar(50) not null
);

create index website_user_id_idx on umami.website(user_id);

create index session_created_at_idx on umami.session(created_at);
create index session_website_id_idx on umami.session(website_id);

create index pageview_created_at_idx on umami.pageview(created_at);
create index pageview_website_id_idx on umami.pageview(website_id);
create index pageview_session_id_idx on umami.pageview(session_id);

create index pageview_website_id_created_at_idx on umami.pageview(website_id, created_at);
create index pageview_website_id_session_id_created_at_idx on umami.pageview(website_id, session_id, created_at);

create index event_created_at_idx on umami.event(created_at);
create index event_website_id_idx on umami.event(website_id);
create index event_session_id_idx on umami.event(session_id);

insert into umami.account (username, password, is_admin) values ('admin', '$2b$10$BUli0c.muyCW1ErNJc3jL.vFRFtFJWrT8/GcR4A.sUdCznaXiqFXa', true);
