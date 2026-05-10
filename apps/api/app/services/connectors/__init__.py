from app.models.connection import ConnectionType
from app.services.connectors.base import (
    CatalogInventory,
    ColumnInfo,
    DataConnector,
    LineageEdge,
    PipelineInfo,
    SchemaInfo,
    TableInfo,
)
from app.services.connectors.databricks import DatabricksConnector
from app.services.connectors.mock import MockConnector
from app.services.connectors.snowflake import SnowflakeConnector


def get_connector(conn_type: ConnectionType, config: dict) -> DataConnector:
    if conn_type == ConnectionType.DATABRICKS:
        return DatabricksConnector(config)
    if conn_type == ConnectionType.SNOWFLAKE:
        return SnowflakeConnector(config)
    return MockConnector(config)


__all__ = [
    "CatalogInventory",
    "ColumnInfo",
    "DataConnector",
    "DatabricksConnector",
    "LineageEdge",
    "MockConnector",
    "PipelineInfo",
    "SchemaInfo",
    "SnowflakeConnector",
    "TableInfo",
    "get_connector",
]
