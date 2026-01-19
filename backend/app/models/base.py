from sqlalchemy.orm import declarative_base
from sqlalchemy import MetaData

# Force all tables to be in the 'public' schema explicitly
metadata = MetaData(schema="public")
Base = declarative_base(metadata=metadata)
