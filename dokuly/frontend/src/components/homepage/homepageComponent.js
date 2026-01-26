import React, { useState, useEffect, useContext, Fragment } from "react";
import { Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getForYouData } from "./functions/queries";
import { AuthContext } from "../App";
import DokulyCard from "../dokuly_components/dokulyCard";
import CardTitle from "../dokuly_components/cardTitle";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import { loadingSpinner } from "../admin/functions/helperFunctions";
import ErrorBoundary from "../common/errorBoundaries";
import { releaseStateFormatter } from "../dokuly_components/formatters/releaseStateFormatter";
import useOrganization from "../common/hooks/useOrganization";

const HomepageComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [organization] = useOrganization();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getForYouData();
      if (response.status === 200) {
        setData(response.data);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        setIsAuthenticated(false);
      } else {
        setError("Failed to load homepage data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePartRowClick = (rowId, row, event) => {
    if (event?.ctrlKey || event?.metaKey) {
      window.open(`#/parts/${row.id}`, "_blank");
    } else {
      navigate(`/parts/${row.id}`);
    }
  };

  const handlePartNavigate = (row) => {
    navigate(`/parts/${row.id}`);
  };

  const handleAssemblyRowClick = (rowId, row, event) => {
    if (event?.ctrlKey || event?.metaKey) {
      window.open(`#/assemblies/${row.id}`, "_blank");
    } else {
      navigate(`/assemblies/${row.id}`);
    }
  };

  const handleAssemblyNavigate = (row) => {
    navigate(`/assemblies/${row.id}`);
  };

  const handlePcbaRowClick = (rowId, row, event) => {
    if (event?.ctrlKey || event?.metaKey) {
      window.open(`#/pcbas/${row.id}`, "_blank");
    } else {
      navigate(`/pcbas/${row.id}`);
    }
  };

  const handlePcbaNavigate = (row) => {
    navigate(`/pcbas/${row.id}`);
  };

  const handleIssueRowClick = (rowId, row, event) => {
    if (event?.ctrlKey || event?.metaKey) {
      window.open(`#/issues/${row.id}`, "_blank");
    } else {
      navigate(`/issues/${row.id}`);
    }
  };

  const handleIssueNavigate = (row) => {
    navigate(`/issues/${row.id}`);
  };

  const handleEcoRowClick = (rowId, row, event) => {
    if (event?.ctrlKey || event?.metaKey) {
      window.open(`#/eco/${row.id}`, "_blank");
    } else {
      navigate(`/eco/${row.id}`);
    }
  };

  const handleEcoNavigate = (row) => {
    navigate(`/eco/${row.id}`);
  };

  if (loading) {
    return (
      <div className="container-fluid mt-2">
        {loadingSpinner()}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid mt-2">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const parts = data?.parts || [];
  const assemblies = data?.assemblies || [];
  const pcbas = data?.pcbas || [];
  const issues = data?.issues || [];
  const ecos = data?.ecos || [];
  const starredParts = data?.starred_parts || [];
  const starredAssemblies = data?.starred_assemblies || [];
  const starredPcbas = data?.starred_pcbas || [];
  const isEcoEnabled = organization?.eco_is_enabled === true;
  const starredCount = starredParts.length + starredAssemblies.length + starredPcbas.length;

  // Define columns for parts table - compact
  const partsColumns = [
    {
      key: "full_part_number",
      header: "Part Number",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "150px",
      formatter: (row) => row.full_part_number || `PRT${row.part_number}`,
    },
    {
      key: "display_name",
      header: "Display Name",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "200px",
      formatter: (row) => {
        const name = row.display_name || "-";
        return name.length > 30 ? `${name.substring(0, 30)}...` : name;
      },
    },
    {
      key: "release_state",
      header: "State",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "100px",
      formatter: releaseStateFormatter,
    },
  ];

  // Define columns for assemblies table - compact
  const assembliesColumns = [
    {
      key: "full_part_number",
      header: "Assembly Number",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "150px",
      formatter: (row) => row.full_part_number || `ASM${row.part_number}`,
    },
    {
      key: "display_name",
      header: "Display Name",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "200px",
      formatter: (row) => {
        const name = row.display_name || "-";
        return name.length > 30 ? `${name.substring(0, 30)}...` : name;
      },
    },
    {
      key: "release_state",
      header: "State",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "100px",
      formatter: releaseStateFormatter,
    },
  ];

  // Define columns for PCBs table - compact
  const pcbasColumns = [
    {
      key: "full_part_number",
      header: "PCBA Number",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "150px",
      formatter: (row) => row.full_part_number || `PCBA${row.part_number}`,
    },
    {
      key: "display_name",
      header: "Display Name",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "200px",
      formatter: (row) => {
        const name = row.display_name || "-";
        return name.length > 30 ? `${name.substring(0, 30)}...` : name;
      },
    },
    {
      key: "release_state",
      header: "State",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "100px",
      formatter: releaseStateFormatter,
    },
  ];

  // Define columns for issues table - compact
  const issuesColumns = [
    {
      key: "id",
      header: "Issue #",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "80px",
      formatter: (row) => `#${row.id}`,
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "250px",
      formatter: (row) => {
        const title = row.title || "Untitled Issue";
        return title.length > 40 ? `${title.substring(0, 40)}...` : title;
      },
    },
    {
      key: "criticality",
      header: "Criticality",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "100px",
      formatter: (row) => {
        const criticality = row.criticality || "Low";
        const colorMap = {
          Low: "info",
          High: "warning",
          Critical: "danger",
        };
        return (
          <span className={`badge badge-pill badge-${colorMap[criticality] || "info"}`}>
            {criticality}
          </span>
        );
      },
    },
  ];

  // Define columns for ECOs table - compact
  const ecosColumns = [
    {
      key: "id",
      header: "ECO #",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "80px",
      formatter: (row) => `ECO${row.id}`,
    },
    {
      key: "display_name",
      header: "Display Name",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "200px",
      formatter: (row) => {
        const name = row.display_name || "-";
        return name.length > 30 ? `${name.substring(0, 30)}...` : name;
      },
    },
    {
      key: "release_state",
      header: "State",
      sortable: true,
      defaultShowColumn: true,
      maxWidth: "100px",
      formatter: releaseStateFormatter,
    },
  ];

  const StatCard = ({ count, label, icon, accentColor, onClick, iconStyle, breakdown }) => {
    const cardStyle = {
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "1.25rem",
      transition: "all 0.2s ease",
      cursor: onClick ? "pointer" : "default",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      position: "relative",
    };

    const iconContainerStyle = {
      width: "40px",
      height: "40px",
      borderRadius: "8px",
      backgroundColor: `${accentColor}15`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "0.75rem",
    };

    const defaultIconStyle = {
      width: "20px",
      height: "20px",
      filter: "invert(31%) sepia(56%) saturate(489%) hue-rotate(123deg) brightness(91%) contrast(87%)",
    };

    const countStyle = {
      fontSize: "2rem",
      fontWeight: "700",
      color: "#1f2937",
      marginBottom: "0.25rem",
      lineHeight: "1.2",
      display: "flex",
      alignItems: "baseline",
      gap: "0.5rem",
    };

    const labelStyle = {
      fontSize: "0.875rem",
      fontWeight: "500",
      color: "#6b7280",
      marginBottom: "0",
    };

    const breakdownStyle = {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      fontSize: "0.875rem",
      color: "#6b7280",
      fontWeight: "400",
      marginLeft: "0.5rem",
    };

    const breakdownItemStyle = {
      display: "flex",
      alignItems: "center",
      gap: "0.20rem",
    };

    const breakdownIconStyle = {
      width: "16px",
      height: "16px",
      filter: "invert(31%) sepia(56%) saturate(489%) hue-rotate(123deg) brightness(91%) contrast(87%)",
    };

    return (
      <div style={{ height: "100%" }}>
        <div
          style={cardStyle}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          }}
          tabIndex={onClick ? 0 : -1}
          role={onClick ? "button" : undefined}
          aria-label={onClick ? `View ${label}` : undefined}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = accentColor;
            e.currentTarget.style.boxShadow = `0 4px 12px ${accentColor}20`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={iconContainerStyle}>
            <img src={icon} alt={label} style={iconStyle || defaultIconStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={countStyle}>
              <span>{count || 0}</span>
              {breakdown && breakdown.length > 0 && (
                <div style={breakdownStyle}>
                  {breakdown.map((item, index) => (
                    <div key={index} style={breakdownItemStyle}>
                      <img
                        src={item.icon}
                        alt={item.label}
                        style={breakdownIconStyle}
                      />
                      <span>{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p style={labelStyle}>{label}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <Fragment>
        <div className="container-fluid mt-2 mainContainerWidth" style={{ paddingBottom: "1rem", maxWidth: "87.77vw" }}>
          {/* Header */}
          <div className="mb-4">
            <h1 style={{ fontSize: "1.875rem", fontWeight: "700", color: "#1f2937", marginBottom: "0.25rem" }}>
              For You
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0" }}>
              Your unreleased items, open issues, and starred items
            </p>
          </div>

          {/* Stats Cards - 6 cards in one row, filling the whole row */}
          <Row className="mb-4" style={{ display: "flex" }}>
            <div style={{ flex: 1, paddingRight: "7.5px" }} className="mb-3">
              <StatCard
                count={stats.unreleased_parts_count || 0}
                label="Unreleased Parts"
                icon="../../static/icons/puzzle.svg"
                accentColor="#165216"
                onClick={() => navigate("/parts")}
              />
            </div>
            <div style={{ flex: 1, paddingLeft: "7.5px", paddingRight: "7.5px" }} className="mb-3">
              <StatCard
                count={stats.unreleased_assemblies_count || 0}
                label="Unreleased Assemblies"
                icon="../../static/icons/assembly.svg"
                accentColor="#165216"
                onClick={() => navigate("/assemblies")}
              />
            </div>
            <div style={{ flex: 1, paddingLeft: "7.5px", paddingRight: "7.5px" }} className="mb-3">
              <StatCard
                count={stats.unreleased_pcbas_count || 0}
                label="Unreleased PCBAs"
                icon="../../static/icons/pcb.svg"
                accentColor="#165216"
                onClick={() => navigate("/pcbas")}
              />
            </div>
            <div style={{ flex: 1, paddingLeft: "7.5px", paddingRight: "7.5px" }} className="mb-3">
              <StatCard
                count={stats.open_issues_count || 0}
                label="Open Issues"
                icon="../../static/icons/alert-circle.svg"
                accentColor="#165216"
                onClick={() => navigate("/projects")}
              />
            </div>
            <div style={{ flex: 1, paddingLeft: "7.5px", paddingRight: "7.5px" }} className="mb-3">
              <StatCard
                count={starredCount}
                label="Starred Items"
                icon="../../static/icons/star.svg"
                accentColor="#fbbf24"
                onClick={() => {
                  // Scroll to starred section
                  const starredSection = document.querySelector('[data-starred-section]');
                  if (starredSection) {
                    starredSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                iconStyle={{
                  width: "20px",
                  height: "20px",
                  filter: "invert(70%) sepia(100%) saturate(2000%) hue-rotate(0deg) brightness(1) contrast(1)",
                }}
                breakdown={[
                  ...(starredParts.length > 0 ? [{
                    icon: "../../static/icons/puzzle.svg",
                    label: "Parts",
                    count: starredParts.length
                  }] : []),
                  ...(starredAssemblies.length > 0 ? [{
                    icon: "../../static/icons/assembly.svg",
                    label: "Assemblies",
                    count: starredAssemblies.length
                  }] : []),
                  ...(starredPcbas.length > 0 ? [{
                    icon: "../../static/icons/pcb.svg",
                    label: "PCBAs",
                    count: starredPcbas.length
                  }] : [])
                ]}
              />
            </div>
            {isEcoEnabled ? (
              <div style={{ flex: 1, paddingLeft: "7.5px", paddingRight: 0 }} className="mb-3">
                <StatCard
                  count={stats.unreleased_ecos_count || 0}
                  label="Unreleased ECOs"
                  icon="../../static/icons/clipboard-list.svg"
                  accentColor="#165216"
                  onClick={() => navigate("/eco")}
                />
              </div>
            ) : (
              <div style={{ flex: 1, paddingLeft: "7.5px", paddingRight: 0 }} className="mb-3">
                {/* Empty space when ECO is disabled */}
              </div>
            )}
          </Row>

          {/* Tables - 2 per row layout */}
          <Row className="mb-3">
            {parts.length > 0 && (
              <Col md={6} className="mb-3" style={{ paddingLeft: 0, paddingRight: "7.5px" }}>
                <DokulyCard className="card rounded p-3" style={{ padding: "1rem", height: "100%", margin: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        backgroundColor: "#16521615",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "0.5rem",
                      }}
                    >
                    <img
                      src="../../static/icons/puzzle.svg"
                      alt="parts"
                      style={{ width: "16px", height: "16px" }}
                    />
                    </div>
                    <h5 style={{ margin: 0, fontSize: "0.875rem", fontWeight: "600" }}>Unreleased Parts</h5>
                    {parts.length > 5 && (
                      <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#6b7280" }}>
                        {parts.length} total
                      </span>
                    )}
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <DokulyTable
                      data={parts.slice(0, 5)}
                      columns={partsColumns}
                      defaultSort={{ columnNumber: 0, order: "desc" }}
                      defaultSortColumn="last_updated"
                      defaultSortDirection="desc"
                      showSearch={false}
                      showPagination={false}
                      showCsvDownload={false}
                      itemsPerPage={5}
                      textSize="13px"
                      onRowClick={handlePartRowClick}
                      navigateColumn={true}
                      onNavigate={handlePartNavigate}
                    />
                  </div>
                </DokulyCard>
              </Col>
            )}

            {assemblies.length > 0 && (
              <Col md={6} className="mb-3" style={{ paddingLeft: "7.5px", paddingRight: 0 }}>
                <DokulyCard className="card rounded p-3" style={{ padding: "1rem", height: "100%", margin: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        backgroundColor: "#108e8215",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "0.5rem",
                      }}
                    >
                      <img
                        src="../../static/icons/assembly.svg"
                        alt="assemblies"
                        style={{ width: "16px", height: "16px" }}
                      />
                    </div>
                    <h5 style={{ margin: 0, fontSize: "0.875rem", fontWeight: "600" }}>Unreleased Assemblies</h5>
                    {assemblies.length > 5 && (
                      <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#6b7280" }}>
                        {assemblies.length} total
                      </span>
                    )}
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <DokulyTable
                      data={assemblies.slice(0, 5)}
                      columns={assembliesColumns}
                      defaultSort={{ columnNumber: 0, order: "desc" }}
                      defaultSortColumn="last_updated"
                      defaultSortDirection="desc"
                      showSearch={false}
                      showPagination={false}
                      showCsvDownload={false}
                      itemsPerPage={5}
                      textSize="13px"
                      onRowClick={handleAssemblyRowClick}
                      navigateColumn={true}
                      onNavigate={handleAssemblyNavigate}
                    />
                  </div>
                </DokulyCard>
              </Col>
            )}
          </Row>

          <Row className="mb-3">
            {pcbas.length > 0 && (
              <Col md={6} className="mb-3" style={{ paddingLeft: 0, paddingRight: "7.5px" }}>
                <DokulyCard className="card rounded p-3" style={{ padding: "1rem", height: "100%", margin: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        backgroundColor: "#da467815",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "0.5rem",
                      }}
                    >
                      <img
                        src="../../static/icons/pcb.svg"
                        alt="pcbas"
                        style={{ width: "16px", height: "16px" }}
                      />
                    </div>
                    <h5 style={{ margin: 0, fontSize: "0.875rem", fontWeight: "600" }}>Unreleased PCBAs</h5>
                    {pcbas.length > 5 && (
                      <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#6b7280" }}>
                        {pcbas.length} total
                      </span>
                    )}
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <DokulyTable
                      data={pcbas.slice(0, 5)}
                      columns={pcbasColumns}
                      defaultSort={{ columnNumber: 0, order: "desc" }}
                      defaultSortColumn="last_updated"
                      defaultSortDirection="desc"
                      showSearch={false}
                      showPagination={false}
                      showCsvDownload={false}
                      itemsPerPage={5}
                      textSize="13px"
                      onRowClick={handlePcbaRowClick}
                      navigateColumn={true}
                      onNavigate={handlePcbaNavigate}
                    />
                  </div>
                </DokulyCard>
              </Col>
            )}

            {issues.length > 0 && (
              <Col md={6} className="mb-3" style={{ paddingLeft: "7.5px", paddingRight: 0 }}>
                <DokulyCard className="card rounded p-3" style={{ padding: "1rem", height: "100%", margin: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        backgroundColor: "#B0002015",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "0.5rem",
                      }}
                    >
                      <img
                        src="../../static/icons/alert-circle.svg"
                        alt="issues"
                        style={{ width: "16px", height: "16px" }}
                      />
                    </div>
                    <h5 style={{ margin: 0, fontSize: "0.875rem", fontWeight: "600" }}>Open Issues</h5>
                    {issues.length > 5 && (
                      <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#6b7280" }}>
                        {issues.length} total
                      </span>
                    )}
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <DokulyTable
                      data={issues.slice(0, 5)}
                      columns={issuesColumns}
                      defaultSort={{ columnNumber: 0, order: "desc" }}
                      defaultSortColumn="id"
                      defaultSortDirection="desc"
                      showSearch={false}
                      showPagination={false}
                      showCsvDownload={false}
                      itemsPerPage={5}
                      textSize="13px"
                      onRowClick={handleIssueRowClick}
                      navigateColumn={true}
                      onNavigate={handleIssueNavigate}
                    />
                  </div>
                </DokulyCard>
              </Col>
            )}

            {/* Unreleased ECOs */}
            {isEcoEnabled && ecos.length > 0 && (
              <Col md={6} className="mb-3" style={{ paddingLeft: issues.length === 0 ? 0 : "7.5px", paddingRight: 0 }}>
                <DokulyCard className="card rounded p-3" style={{ padding: "1rem", height: "100%", margin: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        backgroundColor: "#16521615",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "0.5rem",
                      }}
                    >
                      <img
                        src="../../static/icons/clipboard-list.svg"
                        alt="ecos"
                        style={{ width: "16px", height: "16px" }}
                      />
                    </div>
                    <h5 style={{ margin: 0, fontSize: "0.875rem", fontWeight: "600" }}>Unreleased ECOs</h5>
                    {ecos.length > 5 && (
                      <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#6b7280" }}>
                        {ecos.length} total
                      </span>
                    )}
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <DokulyTable
                      data={ecos.slice(0, 5)}
                      columns={ecosColumns}
                      defaultSort={{ columnNumber: 0, order: "desc" }}
                      defaultSortColumn="last_updated"
                      defaultSortDirection="desc"
                      showSearch={false}
                      showPagination={false}
                      showCsvDownload={false}
                      itemsPerPage={5}
                      textSize="13px"
                      onRowClick={handleEcoRowClick}
                      navigateColumn={true}
                      onNavigate={handleEcoNavigate}
                    />
                  </div>
                </DokulyCard>
              </Col>
            )}
          </Row>

          {/* Starred Items Section */}
          {(starredParts.length > 0 || starredAssemblies.length > 0 || starredPcbas.length > 0) && (
            <Row className="mb-1" data-starred-section>
              <Col md={12} className="mb-1">
                <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                  <img
                    src="../../static/icons/star.svg"
                    alt="starred items"
                    style={{
                      width: "28px",
                      height: "28px",
                      marginRight: "0.75rem",
                      filter: "invert(70%) sepia(100%) saturate(2000%) hue-rotate(0deg) brightness(1) contrast(1)",
                    }}
                  />
                  <h3 style={{ fontSize: "1.75rem", fontWeight: "600", color: "#1f2937", margin: 0 }}>
                    Starred Items
                  </h3>
                </div>
              </Col>
            </Row>
          )}

          <Row className="mb-3">
            {starredParts.length > 0 && (
              <Col md={6} className="mb-3" style={{ paddingLeft: 0, paddingRight: "7.5px" }}>
                <DokulyCard className="card rounded p-3" style={{ padding: "1rem", height: "100%", margin: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        backgroundColor: "#16521615",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "0.5rem",
                      }}
                    >
                      <img
                        src="../../static/icons/puzzle.svg"
                        alt="starred parts"
                        style={{ width: "16px", height: "16px" }}
                      />
                    </div>
                    <h5 style={{ margin: 0, fontSize: "0.875rem", fontWeight: "600" }}>Starred Parts</h5>
                    {starredParts.length > 5 && (
                      <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#6b7280" }}>
                        {starredParts.length} total
                      </span>
                    )}
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <DokulyTable
                      data={starredParts.slice(0, 5)}
                      columns={partsColumns}
                      defaultSort={{ columnNumber: 0, order: "desc" }}
                      defaultSortColumn="last_updated"
                      defaultSortDirection="desc"
                      showSearch={false}
                      showPagination={false}
                      showCsvDownload={false}
                      itemsPerPage={5}
                      textSize="13px"
                      onRowClick={handlePartRowClick}
                      navigateColumn={true}
                      onNavigate={handlePartNavigate}
                    />
                  </div>
                </DokulyCard>
              </Col>
            )}

            {starredAssemblies.length > 0 && (
              <Col md={6} className="mb-3" style={{ paddingLeft: starredParts.length === 0 ? 0 : "7.5px", paddingRight: 0 }}>
                <DokulyCard className="card rounded p-3" style={{ padding: "1rem", height: "100%", margin: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        backgroundColor: "#108e8215",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "0.5rem",
                      }}
                    >
                      <img
                        src="../../static/icons/assembly.svg"
                        alt="starred assemblies"
                        style={{ width: "16px", height: "16px" }}
                      />
                    </div>
                    <h5 style={{ margin: 0, fontSize: "0.875rem", fontWeight: "600" }}>Starred Assemblies</h5>
                    {starredAssemblies.length > 5 && (
                      <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#6b7280" }}>
                        {starredAssemblies.length} total
                      </span>
                    )}
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <DokulyTable
                      data={starredAssemblies.slice(0, 5)}
                      columns={assembliesColumns}
                      defaultSort={{ columnNumber: 0, order: "desc" }}
                      defaultSortColumn="last_updated"
                      defaultSortDirection="desc"
                      showSearch={false}
                      showPagination={false}
                      showCsvDownload={false}
                      itemsPerPage={5}
                      textSize="13px"
                      onRowClick={handleAssemblyRowClick}
                      navigateColumn={true}
                      onNavigate={handleAssemblyNavigate}
                    />
                  </div>
                </DokulyCard>
              </Col>
            )}
          </Row>

          {starredPcbas.length > 0 && (
            <Row className="mb-3">
              <Col md={6} className="mb-3" style={{ paddingLeft: 0, paddingRight: "7.5px" }}>
                <DokulyCard className="card rounded p-3" style={{ padding: "1rem", height: "100%", margin: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        backgroundColor: "#da467815",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "0.5rem",
                      }}
                    >
                      <img
                        src="../../static/icons/pcb.svg"
                        alt="starred pcbas"
                        style={{ width: "16px", height: "16px" }}
                      />
                    </div>
                    <h5 style={{ margin: 0, fontSize: "0.875rem", fontWeight: "600" }}>Starred PCBAs</h5>
                    {starredPcbas.length > 5 && (
                      <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#6b7280" }}>
                        {starredPcbas.length} total
                      </span>
                    )}
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <DokulyTable
                      data={starredPcbas.slice(0, 5)}
                      columns={pcbasColumns}
                      defaultSort={{ columnNumber: 0, order: "desc" }}
                      defaultSortColumn="last_updated"
                      defaultSortDirection="desc"
                      showSearch={false}
                      showPagination={false}
                      showCsvDownload={false}
                      itemsPerPage={5}
                      textSize="13px"
                      onRowClick={handlePcbaRowClick}
                      navigateColumn={true}
                      onNavigate={handlePcbaNavigate}
                    />
                  </div>
                </DokulyCard>
              </Col>
            </Row>
          )}

          {/* Empty State */}
          {parts.length === 0 && assemblies.length === 0 && pcbas.length === 0 && issues.length === 0 && (!isEcoEnabled || ecos.length === 0) && starredParts.length === 0 && starredAssemblies.length === 0 && starredPcbas.length === 0 && (
            <DokulyCard>
              <div className="text-center py-5">
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "12px",
                    backgroundColor: "#16521615",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.5rem",
                  }}
                >
                  <img
                    src="../../static/icons/circle-check.svg"
                    alt="all caught up"
                    style={{
                      width: "32px",
                      height: "32px",
                      filter: "invert(31%) sepia(56%) saturate(489%) hue-rotate(123deg) brightness(91%) contrast(87%)",
                    }}
                  />
                </div>
                <h3 style={{ color: "#1f2937", marginBottom: "0.5rem", fontWeight: "600" }}>All caught up!</h3>
                <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0" }}>
                  You don't have any unreleased items or open issues.
                </p>
              </div>
            </DokulyCard>
          )}
        </div>
      </Fragment>
    </ErrorBoundary>
  );
};

export default HomepageComponent;

