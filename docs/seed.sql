--
-- PostgreSQL database dump
--

\restrict DRO6UMhbEqPf7rGHSDrfuZoEDVW3wP3YmHeqwpR72hhfh2LjKeaMtDj0TuprWeo

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

BEGIN;

-- Reset demo data to make this seed reproducible on a migrated database.
TRUNCATE TABLE
    public.event_speakers,
    public.session_speakers,
    public.registrations,
    public.sessions,
    public.events,
    public.user_roles,
    public.speakers,
    public.users,
    public.roles
RESTART IDENTITY CASCADE;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users (id, email, hashed_password, full_name, is_active, created_at, updated_at) VALUES ('aa37bc14-97b5-415d-be40-70dfbe2ab4b7', 'madebygarzon@gmail.com', '$bcrypt-sha256$v=2,t=2b,r=12$6XeGUkYg.n3W7i/nTVcyWO$fOzgGJPlhO8JduUdbyIzyJubMSzXVU6', 'Carlos Garzón Colorado', true, '2026-04-20 02:38:52.668048+00', '2026-04-20 02:38:52.668056+00');
INSERT INTO public.users (id, email, hashed_password, full_name, is_active, created_at, updated_at) VALUES ('22ffe670-2288-479a-a05d-177d3d48d03d', 'ysosa@gmail.com', '$bcrypt-sha256$v=2,t=2b,r=12$Ui36LmdcUPx58knQ2iFGiO$uLLGrsGSqcITb5W5Rh1BTWA/nG7CRWW', 'Yuliana Sosa Aguirre', true, '2026-04-20 02:48:23.91991+00', '2026-04-20 02:48:23.919915+00');
INSERT INTO public.users (id, email, hashed_password, full_name, is_active, created_at, updated_at) VALUES ('28a3ca55-cc2b-4dae-85da-aaebdaedf2b8', 'jsosa@gmail.com', '$bcrypt-sha256$v=2,t=2b,r=12$03P9Sb0TUDbs03tP0WGw2e$6oxPFIGrjj8jtyaxzcqW/AKQ8YWJHU.', 'Juan Jose Sosa', true, '2026-04-20 03:00:32.309244+00', '2026-04-20 03:00:32.309257+00');

-- Known credential for demo access in Swagger/UI:
-- email: madebygarzon@gmail.com
-- password: Admin123*
UPDATE public.users
SET hashed_password = '$bcrypt-sha256$v=2,t=2b,r=12$P503URKzpo4fJnHPa4oVsu$fF22NgHESwMwW2aNv0nB16hTdc04TUu'
WHERE email = 'madebygarzon@gmail.com';


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.events (id, organizer_id, name, description, location, start_date, end_date, capacity, status, created_at, updated_at, featured_image_sm_url, featured_image_md_url, featured_image_lg_url, featured_image_alt) VALUES ('12ec7da0-ad8c-4f9d-870d-b78230b2cb5e', 'aa37bc14-97b5-415d-be40-70dfbe2ab4b7', 'Bootcamp de programación avanzada', 'Bootcamp de programación avanzada programado por la Universidad de Caldas', 'Auditorio principal', '2026-04-24 13:00:00+00', '2026-04-24 22:00:00+00', 100, 'published', '2026-04-20 02:43:05.426777+00', '2026-04-20 02:43:05.426788+00', 'http://localhost:8000/media/events/79cd9adbc36b4bac9d0aa2128027e9c0_sm_480w.webp', 'http://localhost:8000/media/events/0e46bd0d84384866a59883b985f07d8f_md_640w.webp', 'http://localhost:8000/media/events/a22b61a51f7c4c739f1716ab89e8f26b_lg_640w.webp', 'bootcamp_programacion');
INSERT INTO public.events (id, organizer_id, name, description, location, start_date, end_date, capacity, status, created_at, updated_at, featured_image_sm_url, featured_image_md_url, featured_image_lg_url, featured_image_alt) VALUES ('73ccd88d-c99c-4bdc-b675-9db407945da3', '22ffe670-2288-479a-a05d-177d3d48d03d', 'Día del niño', 'Celebración comunal del día del niño', 'Parque principal', '2026-04-26 14:00:00+00', '2026-04-26 16:59:00+00', 52, 'published', '2026-04-20 02:51:27.097059+00', '2026-04-20 02:51:27.097078+00', 'http://localhost:8000/media/events/0c24da4ab38f411397646ad0336ebab6_sm_480w.webp', 'http://localhost:8000/media/events/35a7ece84638453491c1ebe6a708fbe8_md_640w.webp', 'http://localhost:8000/media/events/0ad5814c67344690ab4be59b38d815a4_lg_640w.webp', 'dia_del_nino');
INSERT INTO public.events (id, organizer_id, name, description, location, start_date, end_date, capacity, status, created_at, updated_at, featured_image_sm_url, featured_image_md_url, featured_image_lg_url, featured_image_alt) VALUES ('f3e8548e-b26b-40db-88f2-a07851a5e880', '22ffe670-2288-479a-a05d-177d3d48d03d', 'Cata de Cafés', 'Festival de Cata de servicios', 'Auditorio de Expoferias', '2026-04-27 13:00:00+00', '2026-04-27 19:00:00+00', 100, 'published', '2026-04-20 02:55:01.832027+00', '2026-04-20 02:55:01.832043+00', 'http://localhost:8000/media/events/43a792c3e9e5424399b47e53edb6253e_sm_480w.webp', 'http://localhost:8000/media/events/c3973ef1b2834335a0f4dc97963078a4_md_640w.webp', 'http://localhost:8000/media/events/ca7a49ea8dc545c6803f4a01352a8ab9_lg_640w.webp', 'cata_de_cafes');
INSERT INTO public.events (id, organizer_id, name, description, location, start_date, end_date, capacity, status, created_at, updated_at, featured_image_sm_url, featured_image_md_url, featured_image_lg_url, featured_image_alt) VALUES ('ebf27efb-4fa6-45bf-905c-a70107293627', '22ffe670-2288-479a-a05d-177d3d48d03d', 'los de la Culpa', 'Presentación del grupo Los de la culpa', 'Expoferias', '2026-04-30 00:00:00+00', '2026-04-30 04:59:00+00', 100, 'published', '2026-04-20 02:58:37.335906+00', '2026-04-20 02:58:37.335936+00', 'http://localhost:8000/media/events/d475b3968b3445c4938b370673da19f4_sm_480w.webp', 'http://localhost:8000/media/events/69e29c42707b4348a2ff13b7eedeef7e_md_640w.webp', 'http://localhost:8000/media/events/eb0530e0a3234c55ac97367c250d7a5d_lg_640w.webp', 'los_de_la_culpa');


--
-- Data for Name: speakers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.speakers (id, full_name, email, bio, company, job_title, photo_url, is_active, created_at, updated_at) VALUES ('ad825419-7c16-4c8e-b113-49799a3e555e', 'Luis Fernando Rivera', NULL, NULL, NULL, NULL, NULL, true, '2026-04-20 02:45:02.406753+00', '2026-04-20 02:45:02.406785+00');
INSERT INTO public.speakers (id, full_name, email, bio, company, job_title, photo_url, is_active, created_at, updated_at) VALUES ('4389e3c0-2af5-4bec-86fa-b523eb344f58', 'Yuliana Sosa Aguirre', 'ysosa@gmail.com', NULL, NULL, NULL, NULL, true, '2026-04-20 02:53:05.019878+00', '2026-04-20 02:53:05.019902+00');


--
-- Data for Name: event_speakers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.registrations (id, user_id, event_id, status, registered_at, notes) VALUES ('82130140-2e99-419c-9b23-0b7c396ff1f8', 'aa37bc14-97b5-415d-be40-70dfbe2ab4b7', '12ec7da0-ad8c-4f9d-870d-b78230b2cb5e', 'registered', '2026-04-20 02:46:33.213652+00', NULL);
INSERT INTO public.registrations (id, user_id, event_id, status, registered_at, notes) VALUES ('4ea24478-d084-4a27-85bf-3a5e8945fd43', '22ffe670-2288-479a-a05d-177d3d48d03d', 'ebf27efb-4fa6-45bf-905c-a70107293627', 'registered', '2026-04-20 02:59:05.670729+00', NULL);
INSERT INTO public.registrations (id, user_id, event_id, status, registered_at, notes) VALUES ('d23b64fe-209f-4116-a5c7-7ab6ec8f6a0d', '22ffe670-2288-479a-a05d-177d3d48d03d', 'f3e8548e-b26b-40db-88f2-a07851a5e880', 'registered', '2026-04-20 02:59:12.739401+00', NULL);
INSERT INTO public.registrations (id, user_id, event_id, status, registered_at, notes) VALUES ('fd15897f-8cdc-42c4-b2cf-8886cba9a526', '22ffe670-2288-479a-a05d-177d3d48d03d', '73ccd88d-c99c-4bdc-b675-9db407945da3', 'registered', '2026-04-20 02:59:23.514392+00', NULL);
INSERT INTO public.registrations (id, user_id, event_id, status, registered_at, notes) VALUES ('9b454f7d-d1f1-419b-b8c4-c5d87990ea88', '22ffe670-2288-479a-a05d-177d3d48d03d', '12ec7da0-ad8c-4f9d-870d-b78230b2cb5e', 'registered', '2026-04-20 02:59:28.761862+00', NULL);
INSERT INTO public.registrations (id, user_id, event_id, status, registered_at, notes) VALUES ('775bdd63-cf5b-4dae-999b-f1939ab48fae', '28a3ca55-cc2b-4dae-85da-aaebdaedf2b8', 'ebf27efb-4fa6-45bf-905c-a70107293627', 'registered', '2026-04-20 03:00:43.11263+00', NULL);
INSERT INTO public.registrations (id, user_id, event_id, status, registered_at, notes) VALUES ('22ffabf1-9596-490a-a3ad-e5b70e897479', '28a3ca55-cc2b-4dae-85da-aaebdaedf2b8', '73ccd88d-c99c-4bdc-b675-9db407945da3', 'registered', '2026-04-20 03:00:49.012808+00', NULL);


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.roles (id, name, description, created_at) VALUES ('eb88deca-c36d-4ccc-8d6b-511f572b1d05', 'attendee', 'Can register to events', '2026-04-20 01:28:59.484356+00');
INSERT INTO public.roles (id, name, description, created_at) VALUES ('0060f15d-855a-4d7a-bff1-57c6de969227', 'organizer', 'Can create and manage owned events', '2026-04-20 01:28:59.484356+00');
INSERT INTO public.roles (id, name, description, created_at) VALUES ('e19f62b2-dbaf-41bc-b909-27ec38344589', 'admin', 'Global management permissions', '2026-04-20 01:28:59.484356+00');


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.sessions (id, event_id, title, description, start_time, end_time, capacity, status, created_at, updated_at) VALUES ('9b174828-b54d-4090-8e44-37041f996b76', '12ec7da0-ad8c-4f9d-870d-b78230b2cb5e', 'Presentación de pensum', 'Bootcamp de programación avanzada', '2026-04-24 13:00:00+00', '2026-04-24 14:00:00+00', 100, 'scheduled', '2026-04-20 02:45:06.574664+00', '2026-04-20 02:45:29.629897+00');
INSERT INTO public.sessions (id, event_id, title, description, start_time, end_time, capacity, status, created_at, updated_at) VALUES ('5f2024d6-19c2-42a8-b2a2-ac3f1aa9e851', '12ec7da0-ad8c-4f9d-870d-b78230b2cb5e', 'Presentación de tutores', 'Bootcamp de programación avanzada', '2026-04-24 14:01:00+00', '2026-04-24 15:00:00+00', 100, 'scheduled', '2026-04-20 02:46:20.899789+00', '2026-04-20 02:46:20.899804+00');
INSERT INTO public.sessions (id, event_id, title, description, start_time, end_time, capacity, status, created_at, updated_at) VALUES ('e6b716d5-c7ab-46e0-a857-46ee95237056', '73ccd88d-c99c-4bdc-b675-9db407945da3', 'Registro de asistentes', 'Registro de niños y padres de familia', '2026-04-26 14:01:00+00', '2026-04-26 15:00:00+00', 52, 'scheduled', '2026-04-20 02:53:08.360615+00', '2026-04-20 02:53:08.36063+00');
INSERT INTO public.sessions (id, event_id, title, description, start_time, end_time, capacity, status, created_at, updated_at) VALUES ('9f3d74ac-1db0-4e80-8f8b-24b5baca14b3', 'f3e8548e-b26b-40db-88f2-a07851a5e880', 'Presentación de Asistentes', 'Presentacion de asistentes de productores', '2026-04-27 14:00:00+00', '2026-04-27 15:00:00+00', 100, 'scheduled', '2026-04-20 02:56:16.350947+00', '2026-04-20 02:56:16.350964+00');


--
-- Data for Name: session_speakers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.session_speakers (id, session_id, speaker_id, assigned_at, role_in_session) VALUES ('255d9935-193e-4d72-a2eb-b22cb1bac0d0', '9b174828-b54d-4090-8e44-37041f996b76', 'ad825419-7c16-4c8e-b113-49799a3e555e', '2026-04-20 02:45:06.602369+00', NULL);
INSERT INTO public.session_speakers (id, session_id, speaker_id, assigned_at, role_in_session) VALUES ('0526bf1a-6031-433d-8d83-7bca643b856f', '5f2024d6-19c2-42a8-b2a2-ac3f1aa9e851', 'ad825419-7c16-4c8e-b113-49799a3e555e', '2026-04-20 02:46:20.919008+00', NULL);
INSERT INTO public.session_speakers (id, session_id, speaker_id, assigned_at, role_in_session) VALUES ('18c493b4-8204-4d5c-8345-8345257502c9', 'e6b716d5-c7ab-46e0-a857-46ee95237056', '4389e3c0-2af5-4bec-86fa-b523eb344f58', '2026-04-20 02:53:08.377216+00', NULL);


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_roles (id, user_id, role_id, assigned_at) VALUES ('3a8a7dda-8f72-44cb-bbfc-983a1a8f284a', 'aa37bc14-97b5-415d-be40-70dfbe2ab4b7', 'e19f62b2-dbaf-41bc-b909-27ec38344589', '2026-04-20 02:40:22.948739+00');
INSERT INTO public.user_roles (id, user_id, role_id, assigned_at) VALUES ('0f0590cf-2628-4a4f-a163-589ae75e37f1', '22ffe670-2288-479a-a05d-177d3d48d03d', '0060f15d-855a-4d7a-bff1-57c6de969227', '2026-04-20 02:48:57.470659+00');
INSERT INTO public.user_roles (id, user_id, role_id, assigned_at) VALUES ('c476eac6-7764-45d2-818d-d771751d74c7', '28a3ca55-cc2b-4dae-85da-aaebdaedf2b8', 'eb88deca-c36d-4ccc-8d6b-511f572b1d05', '2026-04-20 03:00:32.314426+00');

COMMIT;


--
-- PostgreSQL database dump complete
--

\unrestrict DRO6UMhbEqPf7rGHSDrfuZoEDVW3wP3YmHeqwpR72hhfh2LjKeaMtDj0TuprWeo
