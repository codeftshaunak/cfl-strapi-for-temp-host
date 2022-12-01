/*
 *
 * HomePage
 *
 */

import React, { memo, useRef, useState, useEffect, useCallback } from "react";
import {
  PopUpWarning,
  LoadingIndicator,
  request,
  useGlobalContext,
  dateFormats,
  dateToUtcTime,
} from "strapi-helper-plugin";
import { Link, useHistory } from "react-router-dom";
import { Table, Button } from "@buffetjs/core";
import { Duplicate, Remove } from "@buffetjs/icons";
import { Tooltip } from "@buffetjs/styles";
import { Header } from "@buffetjs/custom";
import styled from "styled-components";
import TabsNav from "../../components/Tabs";
import pluginId from "../../pluginId";
import getTrad from "../../utils/getTrad";

const Wrapper = styled.div`
  margin-bottom: 30px;
`;

const CustomTable = styled(Table)`
  p {
    margin-bottom: 0;
  }
  tr,
  td {
    height: 54px !important;
  }
`;

const FooterWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FooterButtonsWrapper = styled.div`
  button {
    margin-right: 0.5rem;
    &:last-of-type {
      margin-right: 0;
    }
  }
`;

const FooterGitHubWrapper = styled.div`
  margin-bottom: 10px;
  display: flex;
  align-content: center;
`;

const HomePage = () => {
  const { push } = useHistory();
  const { formatMessage, plugins, currentEnvironment } = useGlobalContext();
  const [activeTab, setActiveTab] = useState("badges");
  const [rows, setRows] = useState({});

  const headers = {
    badges: [
      { name: "Timestamp", value: "timestamp" },
      { name: "Log Badges", value: "title" },
    ],
    emails: [
      { name: "Timestamp", value: "timestamp" },
      { name: "Log Emails", value: "title" },
    ],
  };

  const refreshLogs = async () => {
    const jobLog = await request(`/${pluginId}/jobs/${activeTab}?_limit=50`, {
      method: "GET",
    });
    const newRows = { ...rows };
    newRows[activeTab] = jobLog.map((x) => ({
      title: JSON.stringify(x.data),
      timestamp: dateToUtcTime(x.data.timestamp).format(dateFormats.datetime),
      dump: x,
    }));
    setRows(newRows);
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  return (
    <div className="container-fluid" style={{ padding: "18px 30px 66px 30px" }}>
      <Header
        isLoading={!plugins[pluginId].isReady}
        actions={[
          {
            label: "Refresh logs",
            onClick: refreshLogs,
            color: "primary",
            type: "button",
            icon: true,
          },
        ]}
        title={{
          label: formatMessage({ id: getTrad("plugin.name") }),
        }}
        content={formatMessage({ id: getTrad("header.description") })}
      />

      <TabsNav
        style={{
          display: "flex-inline",
          marginTop: "0.4rem",
          marginBottom: "2rem",
        }}
        links={[
          {
            isActive: activeTab === "badges",
            name: "Badges Queue",
            onClick: () => setActiveTab("badges"),
          },
          {
            isActive: activeTab === "emails",
            name: "Emails Queue",
            onClick: () => setActiveTab("emails"),
          },
        ]}
      />

      <Wrapper>
        <CustomTable
          className="remove-margin"
          headers={headers[activeTab]}
          rows={rows[activeTab]}
          onClickRow={(e, data) => {
            console.log(data.dump);
          }}
          rowLinks={[]}
        />
      </Wrapper>
    </div>
  );
};

export default memo(HomePage);
