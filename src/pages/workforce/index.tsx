import type { GetServerSideProps } from "next";
import type { ReactElement } from "react";
import Layout from "@layout/index";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/workforce/dashboard",
    permanent: false,
  },
});

/** `/workforce` is not a separate screen; the dashboard lives at `/workforce/dashboard`. */
function WorkforceIndex() {
  return null;
}

WorkforceIndex.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default WorkforceIndex;
