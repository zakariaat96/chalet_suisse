--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chalets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chalets (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    description text NOT NULL,
    main_image character varying(255) NOT NULL,
    gallery_images jsonb,
    price numeric(12,2) NOT NULL,
    beds integer NOT NULL,
    baths integer NOT NULL,
    sqft integer NOT NULL,
    year_built integer,
    property_type character varying(50) DEFAULT NULL::character varying,
    status character varying(50) DEFAULT 'Available'::character varying,
    address character varying(255) NOT NULL,
    city character varying(100) NOT NULL,
    canton character varying(100) NOT NULL,
    postal_code character varying(10) NOT NULL,
    latitude numeric(10,8) DEFAULT NULL::numeric,
    longitude numeric(11,8) DEFAULT NULL::numeric,
    amenities jsonb,
    days_on_market integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id integer NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    features text
);


ALTER TABLE public.chalets OWNER TO postgres;

--
-- Name: chalets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chalets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chalets_id_seq OWNER TO postgres;

--
-- Name: chalets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chalets_id_seq OWNED BY public.chalets.id;


--
-- Name: search_queries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.search_queries (
    id integer NOT NULL,
    user_id integer,
    user_type character varying(20) NOT NULL,
    search_term character varying(255) DEFAULT NULL::character varying,
    location character varying(255) DEFAULT NULL::character varying,
    min_price numeric(15,2) DEFAULT NULL::numeric,
    max_price numeric(15,2) DEFAULT NULL::numeric,
    bedrooms integer,
    bathrooms integer,
    sort_by character varying(50) DEFAULT NULL::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address character varying(45) DEFAULT NULL::character varying,
    session_id character varying(255) DEFAULT NULL::character varying,
    CONSTRAINT search_queries_user_type_check CHECK (((user_type)::text = ANY (ARRAY[('registered'::character varying)::text, ('guest'::character varying)::text])))
);


ALTER TABLE public.search_queries OWNER TO postgres;

--
-- Name: search_queries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.search_queries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.search_queries_id_seq OWNER TO postgres;

--
-- Name: search_queries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.search_queries_id_seq OWNED BY public.search_queries.id;


--
-- Name: user_favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_favorites (
    id integer NOT NULL,
    user_id integer NOT NULL,
    chalet_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_favorites OWNER TO postgres;

--
-- Name: user_favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_favorites_id_seq OWNER TO postgres;

--
-- Name: user_favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_favorites_id_seq OWNED BY public.user_favorites.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    is_admin boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    last_login timestamp without time zone,
    auth_type character varying(10) DEFAULT 'email'::character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: chalets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chalets ALTER COLUMN id SET DEFAULT nextval('public.chalets_id_seq'::regclass);


--
-- Name: search_queries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_queries ALTER COLUMN id SET DEFAULT nextval('public.search_queries_id_seq'::regclass);


--
-- Name: user_favorites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites ALTER COLUMN id SET DEFAULT nextval('public.user_favorites_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: chalets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chalets (id, title, description, main_image, gallery_images, price, beds, baths, sqft, year_built, property_type, status, address, city, canton, postal_code, latitude, longitude, amenities, days_on_market, created_at, updated_at, user_id, is_deleted, features) FROM stdin;
2	Test Chalet	Beautiful test property	uploads/chalets/property_686d4d6eae20b_1751993710.jpg	["uploads/chalets/property_686d4d6ed57c3_1751993710.jpg", "uploads/chalets/property_686d4d6ed393a_1751993710.jpg"]	500000.00	3	2	1500	\N	Chalet	Available	123 Test Street	Zurich	Zurich	8001	\N	\N	[]	0	2025-06-29 12:57:10.83207	2025-07-08 17:55:11.365907	1	f	[]
\.


--
-- Data for Name: search_queries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.search_queries (id, user_id, user_type, search_term, location, min_price, max_price, bedrooms, bathrooms, sort_by, created_at, ip_address, session_id) FROM stdin;
1	1	registered	luxs		\N	\N	\N	\N	default	2025-06-29 19:19:14.154598	::1	\N
2	1	registered	luxs		\N	\N	\N	\N	default	2025-06-29 19:19:14.253126	::1	\N
3	1	registered	lux		\N	\N	\N	\N	default	2025-06-29 19:19:18.700708	::1	\N
4	1	registered	lux		\N	\N	\N	\N	default	2025-06-29 19:19:20.454859	::1	\N
5	1	registered	lux		\N	\N	\N	\N	default	2025-06-29 19:19:20.762871	::1	\N
6	\N	guest	lux		\N	\N	\N	\N	default	2025-07-04 00:10:02.729665	::1	\N
7	\N	guest	lux		\N	\N	\N	\N	default	2025-07-04 00:10:02.78289	::1	\N
\.


--
-- Data for Name: user_favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_favorites (id, user_id, chalet_id, created_at) FROM stdin;
38	1	2	2025-07-04 15:10:07.879109
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, is_admin, created_at, is_deleted, last_login, auth_type) FROM stdin;
1	admin	admin@ChaletsSuisses.com	$2y$10$VvdxwagqsCbD8zSXQfjwD.lCcyaqcQ9sN4mnyyj3NFr19DYDP4s2.	t	2025-05-02 14:24:56	f	2025-07-08 17:52:15.971254	google
\.


--
-- Name: chalets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chalets_id_seq', 2, true);


--
-- Name: search_queries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.search_queries_id_seq', 7, true);


--
-- Name: user_favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_favorites_id_seq', 47, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 21, true);


--
-- Name: chalets chalets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chalets
    ADD CONSTRAINT chalets_pkey PRIMARY KEY (id);


--
-- Name: search_queries search_queries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_queries
    ADD CONSTRAINT search_queries_pkey PRIMARY KEY (id);


--
-- Name: user_favorites user_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_pkey PRIMARY KEY (id);


--
-- Name: user_favorites user_favorites_user_id_chalet_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_chalet_id_key UNIQUE (user_id, chalet_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_chalets_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chalets_user_id ON public.chalets USING btree (user_id);


--
-- Name: idx_search_queries_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_search_queries_user_id ON public.search_queries USING btree (user_id);


--
-- Name: idx_user_favorites_chalet_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_favorites_chalet_id ON public.user_favorites USING btree (chalet_id);


--
-- Name: idx_user_favorites_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_favorites_user_id ON public.user_favorites USING btree (user_id);


--
-- Name: chalets update_chalets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_chalets_updated_at BEFORE UPDATE ON public.chalets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: chalets fk_user_chalet; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chalets
    ADD CONSTRAINT fk_user_chalet FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: search_queries search_queries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_queries
    ADD CONSTRAINT search_queries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_favorites user_favorites_chalet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_chalet_id_fkey FOREIGN KEY (chalet_id) REFERENCES public.chalets(id);


--
-- Name: user_favorites user_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

