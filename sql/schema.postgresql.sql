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
    updated_at timestamp with time zone default current_timestamp,
    pan_account_id int references pandium.organizations(id) on delete cascade
);

ALTER TABLE umami.account ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_isolation_policy ON umami.account
USING (pan_account_id = current_setting('app.pan_account')::int or current_setting('app.pan_account')::int = 420);

create table umami.website (
    website_id serial primary key,
    website_uuid uuid unique not null,
    user_id int not null references umami.account(user_id) on delete cascade,
    name varchar(100) not null,
    domain varchar(500),
    share_id varchar(64) unique,
    created_at timestamp with time zone default current_timestamp,
    pan_account_id int references pandium.organizations(id) on delete cascade
);

ALTER TABLE umami.website ENABLE ROW LEVEL SECURITY;

CREATE POLICY website_isolation_policy ON umami.website
USING (pan_account_id = current_setting('app.pan_account')::int or current_setting('app.pan_account')::int = 420);

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
    country char(2),
    pan_account_id int references pandium.organizations(id) on delete cascade
);

ALTER TABLE umami.session ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_isolation_policy ON umami.session
USING (pan_account_id = current_setting('app.pan_account')::int or current_setting('app.pan_account')::int = 420);

create table umami.pageview (
    view_id serial primary key,
    website_id int not null references umami.website(website_id) on delete cascade,
    session_id int not null references umami.session(session_id) on delete cascade,
    created_at timestamp with time zone default current_timestamp,
    url varchar(500) not null,
    referrer varchar(500),
    pan_account_id int references pandium.organizations(id) on delete cascade
);

ALTER TABLE umami.pageview ENABLE ROW LEVEL SECURITY;

CREATE POLICY pageview_isolation_policy ON umami.pageview
USING (pan_account_id = current_setting('app.pan_account')::int or current_setting('app.pan_account')::int = 420);

create table umami.event (
    event_id serial primary key,
    website_id int not null references umami.website(website_id) on delete cascade,
    session_id int not null references umami.session(session_id) on delete cascade,
    created_at timestamp with time zone default current_timestamp,
    url varchar(500) not null,
    event_type varchar(50) not null,
    event_value varchar(50) not null,
    pan_account_id int references pandium.organizations(id) on delete cascade
);

ALTER TABLE umami.event ENABLE ROW LEVEL SECURITY;

CREATE POLICY event_isolation_policy ON umami.event
USING (pan_account_id = current_setting('app.pan_account')::int or current_setting('app.pan_account')::int = 420);

create index website_user_id_idx on umami.website(user_id);
create index website_pan_account_id_idx on umami.website(pan_account_id);

create index session_created_at_idx on umami.session(created_at);
create index session_website_id_idx on umami.session(website_id);
create index session_pan_account_id_idx on umami.session(pan_account_id);

create index pageview_created_at_idx on umami.pageview(created_at);
create index pageview_website_id_idx on umami.pageview(website_id);
create index pageview_session_id_idx on umami.pageview(session_id);
create index pageview_pan_account_id_idx on umami.pageview(pan_account_id);

create index pageview_website_id_created_at_idx on umami.pageview(website_id, created_at);
create index pageview_website_id_session_id_created_at_idx on umami.pageview(website_id, session_id, created_at);
create index pageview_website_id_session_id_created_at_pan_acct_id_idx on umami.pageview(website_id, session_id, created_at, pan_account_id);

create index event_created_at_idx on umami.event(created_at);
create index event_website_id_idx on umami.event(website_id);
create index event_session_id_idx on umami.event(session_id);
create index event_pan_account_id_idx on umami.event(pan_account_id);

insert into pandium.organizations (id, name, org_type) values (420, 'pandium', 'ACCOUNT');
insert into umami.account (username, password, is_admin, pan_account_id) values ('admin', '$2b$10$BUli0c.muyCW1ErNJc3jL.vFRFtFJWrT8/GcR4A.sUdCznaXiqFXa', true, 420);

GRANT USAGE ON SCHEMA umami TO umami_app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA umami TO umami_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA umami TO umami_app_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA umami TO umami_app_user;
