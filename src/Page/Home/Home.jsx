"use client";

import { Button } from "../../components/ui/button";
import { FiDownload } from "react-icons/fi";
import Link from "next/link";
import Social from "../../components/Social";
import Photo from "../../components/Photo";
import Stats from "../../components/Stats";
import { motion } from 'framer-motion';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const Home = () => {
  return (
    <section className="h-full">
      <div className="container mx-auto h-full">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between lg:pt-16 lg:pb-20">
          {/* text */}
          <motion.div className="text-center lg:text-left" variants={container} initial="hidden" animate="show">
            <motion.span variants={item} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm tracking-[0.25em] text-accent uppercase shadow-[0_0_0_1px_rgba(102,224,196,0.08)]">
              Backend Software Engineer
            </motion.span>

            <motion.h1 variants={item} className="h2 mt-7 mb-7">
              Sazedul Islam
            </motion.h1>

            <motion.p variants={item} className="max-w-[620px] text-lg leading-relaxed mb-8 text-[#c6d2e2] mx-auto lg:mx-0">
              I build secure, scalable backend systems and clean full-stack integrations using
              <span className="font-semibold text-[#f2f7fd]"> Node.js, NestJS, TypeScript</span>,
              and modern cloud-native tooling. My focus is on APIs, real-time features, database design,
              and production-ready engineering.
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap justify-center lg:justify-start gap-3 mb-12">
              {['REST APIs','Microservices','PostgreSQL','AWS & Docker'].map((t, i) => (
                <motion.span key={i} variants={item} className="rounded-full border border-white/6 bg-[#07101b] px-4 py-2 text-sm text-[#bcd3e6] backdrop-blur-sm">
                  {t}
                </motion.span>
              ))}
            </motion.div>

            {/* button */}
            <motion.div variants={item} className="flex flex-col lg:flex-row items-center gap-6">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button asChild size="lg" className="uppercase flex items-center gap-2 bg-gradient-to-br from-[#66e0c4] to-[#43c6ad] text-[#06111c] neon-pulse">
                  <Link href="/contact">
                    <span>Hire Me</span>
                  </Link>
                </Button>
              </motion.div>

              <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} href="/Sazedul Islam Backend Engineer.pdf" download>
                <Button
                  variant="outline"
                  size="lg"
                  className="uppercase flex items-center gap-3 border-accent"
                >
                  <span>Download Resume</span>
                  <FiDownload className="text-xl text-accent" />
                </Button>
              </motion.a>

              <motion.div variants={item} className="mb-8 lg:mb-0">
                <Social
                  containerStyles="flex gap-6"
                  iconStyles="w-9 h-9 border border-accent rounded-full flex justify-center items-center text-accent text-base hover:bg-accent hover:text-[#06111c] hover:transition-all duration-500"
                ></Social>
              </motion.div>
            </motion.div>
            </motion.div>

          {/* photo */}
          <div className="mb-8 lg:mb-0 w-full flex justify-center lg:justify-end">
            <div className="w-[200px] sm:w-[260px] lg:w-[420px]">
              <Photo />
            </div>
          </div>
        </div>

        {/* stats */}
        <div>
          <Stats></Stats>
        </div>

        {/* services */}
        {/* <Services></Services> */}
      </div>
    </section>
  );
};

export default Home;
