# Estimate size requirements for the data storage system (only looking at core data)

# Helper to format bytes into readable strings
def format_bytes(b):
    if b < 1024:
        return f"{b} B"
    elif b < 1024**2:
        return f"{b / 1024:.2f} KB"
    elif b < 1024**3:
        return f"{b / 1024 / 1024:.2f} MB"
    else:
        return f"{b / 1024 / 1024 / 1024:.2f} GB"

# Parameters to adjust based on expected scaling
def estimate_storage(
    num_agents=10000,
    num_spaces=500,
    num_contexts_per_year=50,
    num_years=5,
    avg_agents_per_context=3,
    num_relationships=100000000, # 100M
    overhead_factor=1.5  # 50% for indexes, metadata, etc.
):
    # Size estimates in Bytes (based on standard sizes)
    size_per_agent = 120
    size_per_space = 120
    size_per_context_base = 124
    size_per_agent_context_link = 8
    size_per_relationship = 8

    # Total entries over time
    total_contexts = num_contexts_per_year * num_years
    total_agent_context_links = total_contexts * avg_agents_per_context

    # Base sizes (in Bytes)
    agent_storage = num_agents * size_per_agent
    space_storage = num_spaces * size_per_space
    context_storage = total_contexts * size_per_context_base
    agent_context_storage = total_agent_context_links * size_per_agent_context_link
    relationship_storage = num_relationships * size_per_relationship

    # Totals
    total_raw = ( # Total raw data size without overhead
        agent_storage
        + space_storage
        + context_storage
        + agent_context_storage
        + relationship_storage
    )

    total_with_overhead = total_raw * overhead_factor

    # Return formatted results
    return {
        "agents:": format_bytes(agent_storage),
        "spaces:": format_bytes(space_storage),
        "contexts:": format_bytes(context_storage),
        "agent-context M2M:": format_bytes(agent_context_storage),
        "relationships:": format_bytes(relationship_storage),
        "total raw:": format_bytes(total_raw),
        "total with overhead:": format_bytes(total_with_overhead),
    }

# Run with example parameters
if __name__ == "__main__":
    
    # Calculate storage estimates
    result = estimate_storage() 

    # Print results in a table
    print(f"{'Component':<35} {'Estimated Size (MB)':>20}")
    print("-" * 60)
    for k, v in result.items():
        if isinstance(v, (int, float)):
            print(f"{k:<35} {v:>20.2f}")
        else:
            print(f"{k:<35} {str(v):>20}")